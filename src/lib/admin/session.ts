import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "eph_admin_session";

/** Default session lifetime: 8 hours. */
export const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type CreateOptions = {
  nowMs?: number;
  ttlMs?: number;
};

function getAdminToken(): string {
  return process.env.ADMIN_TOKEN?.trim() ?? "";
}

function getSigningSecret(): string {
  const token = getAdminToken();
  if (!token) {
    throw new Error("ADMIN_TOKEN is not configured");
  }
  const explicit = process.env.ADMIN_SESSION_SECRET?.trim();
  if (explicit) {
    return explicit;
  }
  // Derive a dedicated signing key from the admin token so a stolen session
  // cookie cannot be forged without the token, even without a separate secret.
  return createHmac("sha256", "eph-admin-session-key-v1")
    .update(token)
    .digest("hex");
}

function toBase64Url(value: Buffer | string): string {
  const buffer = typeof value === "string" ? Buffer.from(value, "utf8") : value;
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string): Buffer {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padLength), "base64");
}

function sign(payload: string): string {
  return toBase64Url(
    createHmac("sha256", getSigningSecret()).update(payload).digest(),
  );
}

/**
 * Create a signed admin session token: `base64url(expMs).signature`.
 */
export async function createAdminSessionToken(
  options: CreateOptions = {},
): Promise<string> {
  if (!getAdminToken()) {
    throw new Error("ADMIN_TOKEN is not configured");
  }
  const nowMs = options.nowMs ?? Date.now();
  const ttlMs = options.ttlMs ?? ADMIN_SESSION_TTL_MS;
  const payload = toBase64Url(String(nowMs + ttlMs));
  return `${payload}.${sign(payload)}`;
}

/**
 * Verify a signed admin session token. Returns false for missing, malformed,
 * tampered, or expired tokens, and when ADMIN_TOKEN is unset.
 */
export async function verifyAdminSessionToken(
  token: string | undefined | null,
): Promise<boolean> {
  if (!token || !getAdminToken()) {
    return false;
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }
  const [payload, signature] = parts;
  if (!payload || !signature) {
    return false;
  }

  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return false;
  }

  const providedBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return false;
  }

  try {
    const expMs = Number(fromBase64Url(payload).toString("utf8"));
    if (!Number.isFinite(expMs) || Date.now() >= expMs) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

/**
 * Timing-safe password comparison via SHA-256 digests so unequal lengths
 * do not short-circuit.
 */
export async function passwordsMatch(
  provided: string,
  expected: string,
): Promise<boolean> {
  if (!provided || !expected) {
    return false;
  }
  const providedDigest = createHmac("sha256", "eph-admin-password-v1")
    .update(provided)
    .digest();
  const expectedDigest = createHmac("sha256", "eph-admin-password-v1")
    .update(expected)
    .digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}

export function getAdminSessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
