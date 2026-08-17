import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_BYTES = 32;
const PUBLIC_ID_BYTES = 16;

export function generateOpaqueToken(bytes = TOKEN_BYTES): string {
  return randomBytes(bytes).toString("base64url");
}

export function generatePublicId(): string {
  return generateOpaqueToken(PUBLIC_ID_BYTES);
}

export function generateRestoreToken(): string {
  return generateOpaqueToken(TOKEN_BYTES);
}

export function generateSessionToken(): string {
  return generateOpaqueToken(TOKEN_BYTES);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokensMatch(
  provided: string | undefined | null,
  expected: string | undefined | null,
): boolean {
  if (!provided || !expected) {
    return false;
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
