import { timingSafeEqual } from "node:crypto";

function authorizationHeader(request: Request): string {
  return request.headers.get("authorization") ?? "";
}

/**
 * Activepieces server-to-server auth for cart status/data APIs.
 * Fail closed when the secret is unset.
 */
export function authorizeAbandonedCartApi(request: Request): boolean {
  const secret = process.env.ACTIVEPIECES_CART_API_SECRET?.trim();
  if (!secret) {
    return false;
  }
  const expected = `Bearer ${secret}`;
  const provided = authorizationHeader(request);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
