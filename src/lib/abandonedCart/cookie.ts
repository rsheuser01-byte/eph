import { CART_SESSION_COOKIE, SAVED_CART_TTL_MS } from "./constants";

export { CART_SESSION_COOKIE };

export function getCartSessionCookieOptions(maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds ?? Math.floor(SAVED_CART_TTL_MS / 1000),
  };
}

export function readCookieValue(
  request: Request,
  name: string,
): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) {
    return undefined;
  }
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq < 1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (key !== name) {
      continue;
    }
    try {
      return decodeURIComponent(trimmed.slice(eq + 1));
    } catch {
      return trimmed.slice(eq + 1);
    }
  }
  return undefined;
}

export function readCartSessionToken(request: Request): string | undefined {
  const value = readCookieValue(request, CART_SESSION_COOKIE)?.trim();
  return value || undefined;
}
