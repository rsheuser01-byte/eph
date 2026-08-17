import { isValidEmail, normalizeEmail } from "./email";
import type { CartLineInput } from "./types";

export type ParseCartSyncResult =
  | { ok: true; items: CartLineInput[] }
  | { ok: false; error: string };

export type ParseIdentifyResult =
  | { ok: true; email: string; firstName: string }
  | { ok: false; error: string };

function asRecord(input: unknown): Record<string, unknown> | null {
  if (typeof input !== "object" || input === null) {
    return null;
  }
  return input as Record<string, unknown>;
}

export function parseCartLineInputs(input: unknown): CartLineInput[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const lines: CartLineInput[] = [];
  for (const raw of input) {
    const record = asRecord(raw);
    if (!record) {
      continue;
    }
    const slug = typeof record.slug === "string" ? record.slug.trim() : "";
    const size = typeof record.size === "string" ? record.size.trim() : "";
    const qty = typeof record.qty === "number" ? record.qty : Number(record.qty);
    if (!slug || !size || !Number.isFinite(qty)) {
      continue;
    }
    lines.push({ slug, size, qty });
  }
  return lines;
}

export function parseCartSyncRequest(input: unknown): ParseCartSyncResult {
  const record = asRecord(input);
  if (!record) {
    return { ok: false, error: "Invalid request body." };
  }
  if (!Object.prototype.hasOwnProperty.call(record, "items")) {
    return { ok: false, error: "Items are required." };
  }
  if (!Array.isArray(record.items)) {
    return { ok: false, error: "Items must be an array." };
  }
  return { ok: true, items: parseCartLineInputs(record.items) };
}

export function parseIdentifyRequest(input: unknown): ParseIdentifyResult {
  const record = asRecord(input);
  if (!record) {
    return { ok: false, error: "Invalid request body." };
  }
  const emailRaw = typeof record.email === "string" ? record.email : "";
  if (!isValidEmail(emailRaw)) {
    return { ok: false, error: "A valid email address is required." };
  }
  const firstName =
    typeof record.firstName === "string" ? record.firstName.trim() : "";
  return { ok: true, email: normalizeEmail(emailRaw), firstName };
}

export function parseRestoreRequest(input: unknown): string | null {
  const record = asRecord(input);
  if (!record) {
    return null;
  }
  const token = typeof record.token === "string" ? record.token.trim() : "";
  return token || null;
}
