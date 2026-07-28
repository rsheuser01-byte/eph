import { createHash, timingSafeEqual } from "node:crypto";
import { parseAmountToCents } from "./money";
import { signBankfulHppPayload } from "./bankful";

/** Currencies accepted for Elevate checkout today. */
export const SUPPORTED_CURRENCIES = new Set(["USD"]);

export type BankfulCallbackStatus =
  | "approved"
  | "declined"
  | "pending"
  | "cancelled"
  | "unknown";

export type VerifiedBankfulCallback = {
  orderId: string;
  transactionId: string;
  status: BankfulCallbackStatus;
  amountCents: number;
  currency: string;
  rawStatus: string;
  /** Prefer TRANS_REQUEST_ID / TRANS_RECORD_ID when present. */
  providerEventId: string;
};

export type CallbackVerifyFailureReason =
  | "missing_signature"
  | "invalid_signature"
  | "missing_order_id"
  | "missing_transaction_id"
  | "unsupported_currency"
  | "malformed_amount"
  | "missing_password";

export type CallbackVerifyResult =
  | { ok: true; callback: VerifiedBankfulCallback; fields: Record<string, string> }
  | { ok: false; reason: CallbackVerifyFailureReason; fields: Record<string, string> };

function field(
  fields: Record<string, string>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const direct = fields[key];
    if (direct !== undefined && direct !== "") {
      return direct;
    }
    const found = Object.entries(fields).find(
      ([name]) => name.toLowerCase() === key.toLowerCase(),
    );
    if (found && found[1] !== "") {
      return found[1];
    }
  }
  return "";
}

export function normalizeBankfulStatus(raw: string): BankfulCallbackStatus {
  const status = raw.trim().toUpperCase();
  switch (status) {
    case "APPROVED":
      return "approved";
    case "DECLINED":
      return "declined";
    case "PENDING":
      return "pending";
    case "CANCELLED":
    case "CANCELED":
      return "cancelled";
    default:
      return "unknown";
  }
}

/**
 * Normalize mixed-case Bankful callback field names into a typed preview.
 * Does not authenticate — call verifyBankfulCallback before acting.
 */
export function parseBankfulCallbackFields(fields: Record<string, string>): {
  orderId: string;
  transactionId: string;
  rawStatus: string;
  amountRaw: string;
  currency: string;
  signature: string;
  requestId: string;
  recordId: string;
} {
  return {
    orderId: field(fields, "XTL_ORDER_ID", "xtl_order_id", "orderId"),
    transactionId: field(
      fields,
      "TRANS_ORDER_ID",
      "TRANS_REQUEST_ID",
      "trans_order_id",
      "trans_request_id",
    ),
    rawStatus: field(
      fields,
      "TRANS_STATUS_NAME",
      "trans_status_name",
      "status",
    ).toUpperCase(),
    amountRaw: field(fields, "TRANS_VALUE", "trans_value", "amount"),
    currency: field(fields, "TRANS_CUR", "trans_cur", "request_currency", "currency").toUpperCase(),
    signature: field(fields, "SIGNATURE", "signature"),
    requestId: field(fields, "TRANS_REQUEST_ID", "trans_request_id"),
    recordId: field(fields, "TRANS_RECORD_ID", "trans_record_id"),
  };
}

function signaturesEqual(expected: string, provided: string): boolean {
  const a = Buffer.from(expected.toLowerCase());
  const b = Buffer.from(provided.toLowerCase());
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Verify a Bankful HPP callback / response signature.
 *
 * Per Bankful HPP docs ("Signature Verify"):
 * 1. Remove SIGNATURE from the payload
 * 2. Sort remaining non-empty key/value pairs alphabetically
 * 3. Concatenate key+value with no separators
 * 4. HMAC-SHA256 with the gateway password; hex-encode
 * 5. Constant-time compare to the provided signature
 */
export function verifyBankfulCallback(
  fields: Record<string, string>,
  password: string,
): CallbackVerifyResult {
  const normalizedFields = { ...fields };
  const parsed = parseBankfulCallbackFields(normalizedFields);

  if (!password) {
    return { ok: false, reason: "missing_password", fields: normalizedFields };
  }

  if (!parsed.signature) {
    return { ok: false, reason: "missing_signature", fields: normalizedFields };
  }

  const expected = signBankfulHppPayload(normalizedFields, password);
  if (!signaturesEqual(expected, parsed.signature)) {
    return { ok: false, reason: "invalid_signature", fields: normalizedFields };
  }

  if (!parsed.orderId) {
    return { ok: false, reason: "missing_order_id", fields: normalizedFields };
  }

  if (!parsed.transactionId) {
    return {
      ok: false,
      reason: "missing_transaction_id",
      fields: normalizedFields,
    };
  }

  if (!parsed.currency || !SUPPORTED_CURRENCIES.has(parsed.currency)) {
    return {
      ok: false,
      reason: "unsupported_currency",
      fields: normalizedFields,
    };
  }

  const amountCents = parseAmountToCents(parsed.amountRaw);
  if (amountCents === null || amountCents < 0) {
    return { ok: false, reason: "malformed_amount", fields: normalizedFields };
  }

  const providerEventId =
    parsed.requestId ||
    parsed.recordId ||
    `hash:${createEventHash(parsed.orderId, parsed.transactionId, parsed.rawStatus, amountCents, parsed.currency)}`;

  return {
    ok: true,
    fields: normalizedFields,
    callback: {
      orderId: parsed.orderId,
      transactionId: parsed.transactionId,
      status: normalizeBankfulStatus(parsed.rawStatus),
      amountCents,
      currency: parsed.currency,
      rawStatus: parsed.rawStatus,
      providerEventId: `bankful:${providerEventId}`,
    },
  };
}

export function createEventHash(
  orderId: string,
  transactionId: string,
  rawStatus: string,
  amountCents: number,
  currency: string,
): string {
  // Deterministic idempotency key when Bankful omits request/record ids.
  return createHash("sha256")
    .update([orderId, transactionId, rawStatus, String(amountCents), currency].join("|"))
    .digest("hex")
    .slice(0, 32);
}
