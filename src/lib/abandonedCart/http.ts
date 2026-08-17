import { NextResponse } from "next/server";
import {
  CART_SESSION_COOKIE,
  getCartSessionCookieOptions,
} from "./cookie";

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function withCartSessionCookie(
  response: NextResponse,
  sessionToken: string,
): NextResponse {
  response.cookies.set(
    CART_SESSION_COOKIE,
    sessionToken,
    getCartSessionCookieOptions(),
  );
  return response;
}

export function abandonedCartOk(): NextResponse {
  return NextResponse.json({ ok: true });
}
