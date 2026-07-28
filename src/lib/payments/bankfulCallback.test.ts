import { describe, expect, it } from "vitest";
import { signBankfulHppPayload } from "./bankful";
import {
  normalizeBankfulStatus,
  parseBankfulCallbackFields,
  verifyBankfulCallback,
} from "./bankfulCallback";

const PASSWORD = "sandbox_password";

function signedCallback(
  overrides: Record<string, string> = {},
): Record<string, string> {
  const fields: Record<string, string> = {
    REQUEST_ACTION: "CAPTURE",
    TRANS_STATUS_NAME: "APPROVED",
    TRANS_VALUE: "19.9900",
    TRANS_REQUEST_ID: "1272",
    TRANS_RECORD_ID: "79154",
    TRANS_ORDER_ID: "980982121",
    XTL_ORDER_ID: "ord_test_1",
    TRANS_CUR: "USD",
    TIMESTAMP: "2021-05-06T11:16:50Z",
    ...overrides,
  };
  const signature = signBankfulHppPayload(fields, PASSWORD);
  return { ...fields, SIGNATURE: signature };
}

describe("normalizeBankfulStatus", () => {
  it("maps known Bankful statuses", () => {
    expect(normalizeBankfulStatus("APPROVED")).toBe("approved");
    expect(normalizeBankfulStatus("DECLINED")).toBe("declined");
    expect(normalizeBankfulStatus("PENDING")).toBe("pending");
    expect(normalizeBankfulStatus("CANCELLED")).toBe("cancelled");
    expect(normalizeBankfulStatus("canceled")).toBe("cancelled");
    expect(normalizeBankfulStatus("WEIRD")).toBe("unknown");
  });
});

describe("verifyBankfulCallback", () => {
  it("accepts a valid signed callback", () => {
    const fields = signedCallback();
    const result = verifyBankfulCallback(fields, PASSWORD);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.callback.orderId).toBe("ord_test_1");
    expect(result.callback.transactionId).toBe("980982121");
    expect(result.callback.status).toBe("approved");
    expect(result.callback.amountCents).toBe(1999);
    expect(result.callback.currency).toBe("USD");
  });

  it("rejects a missing signature", () => {
    const { SIGNATURE: _, ...fields } = signedCallback();
    const result = verifyBankfulCallback(fields, PASSWORD);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("missing_signature");
  });

  it("rejects an invalid signature", () => {
    const fields = signedCallback();
    fields.SIGNATURE = "0".repeat(64);
    const result = verifyBankfulCallback(fields, PASSWORD);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("invalid_signature");
  });

  it("rejects a tampered amount even if status looks approved", () => {
    const fields = signedCallback();
    fields.TRANS_VALUE = "1.00";
    const result = verifyBankfulCallback(fields, PASSWORD);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("invalid_signature");
  });

  it("rejects missing order id", () => {
    const fields = signedCallback({ XTL_ORDER_ID: "" });
    delete fields.XTL_ORDER_ID;
    const signature = signBankfulHppPayload(fields, PASSWORD);
    const result = verifyBankfulCallback(
      { ...fields, SIGNATURE: signature },
      PASSWORD,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("missing_order_id");
  });

  it("rejects missing transaction reference", () => {
    const base = {
      REQUEST_ACTION: "CAPTURE",
      TRANS_STATUS_NAME: "APPROVED",
      TRANS_VALUE: "19.9900",
      XTL_ORDER_ID: "ord_test_1",
      TRANS_CUR: "USD",
    };
    const signature = signBankfulHppPayload(base, PASSWORD);
    const result = verifyBankfulCallback(
      { ...base, SIGNATURE: signature },
      PASSWORD,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("missing_transaction_id");
  });

  it("rejects unsupported currency", () => {
    const fields = signedCallback({ TRANS_CUR: "EUR" });
    const result = verifyBankfulCallback(fields, PASSWORD);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("unsupported_currency");
  });

  it("rejects malformed amount", () => {
    const fields = signedCallback({ TRANS_VALUE: "not-a-number" });
    const result = verifyBankfulCallback(fields, PASSWORD);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("malformed_amount");
  });

  it("verifies declined payloads using the documented field set (round-trip)", () => {
    // Bankful HPP docs list these response fields and the sort+HMAC algorithm.
    // Their published example digest uses an unpublished key, so we assert
    // round-trip verify against our merchant password instead of that digest.
    const fields = {
      API_ADVICE: "DECLINE",
      ERROR_MESSAGE: "DECLINE",
      PROCESSOR_ADVICE: "DECLINE",
      REQUEST_ACTION: "CAPTURE",
      SERVICE_ADVICE: "DECLINE",
      TIMESTAMP: "2021-05-10T12:30:10Z",
      TRANS_CUR: "USD",
      TRANS_ORDER_ID: "187697436",
      TRANS_RECORD_ID: "1442805",
      TRANS_REQUEST_ID: "1364252",
      TRANS_STATUS_NAME: "DECLINED",
      TRANS_VALUE: "0.0100",
      XTL_ORDER_ID: "1212",
    };
    const signature = signBankfulHppPayload(fields, PASSWORD);
    const result = verifyBankfulCallback(
      { ...fields, SIGNATURE: signature },
      PASSWORD,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.callback.status).toBe("declined");
    expect(result.callback.amountCents).toBe(1);
  });
});

describe("parseBankfulCallbackFields", () => {
  it("normalizes mixed-case field names", () => {
    const parsed = parseBankfulCallbackFields({
      xtl_order_id: "abc",
      trans_status_name: "approved",
      TRANS_ORDER_ID: "tx1",
      TRANS_VALUE: "10.00",
      TRANS_CUR: "usd",
    });
    expect(parsed.orderId).toBe("abc");
    expect(parsed.rawStatus).toBe("APPROVED");
    expect(parsed.transactionId).toBe("tx1");
    expect(parsed.currency).toBe("USD");
  });
});
