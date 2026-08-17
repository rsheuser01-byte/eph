import { NextResponse } from "next/server";
import { readCartSessionToken } from "@/lib/abandonedCart/cookie";
import {
  abandonedCartOk,
  withCartSessionCookie,
} from "@/lib/abandonedCart/http";
import {
  parseCartLineInputs,
  parseIdentifyRequest,
} from "@/lib/abandonedCart/parseRequest";
import { identifySavedCart } from "@/lib/abandonedCart/service";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Associate a checkout email with the current saved cart.
 * Does not block checkout UI; webhook is fire-and-forget after persist.
 */
export async function POST(request: Request) {
  const limited = await checkRateLimit(
    "abandonedCartIdentify",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.abandonedCartIdentify,
  );
  if (!limited.allowed) {
    return tooManyRequestsResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = parseIdentifyRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const record = body as { items?: unknown };
  const lines = parseCartLineInputs(record.items);

  try {
    const result = await identifySavedCart(
      readCartSessionToken(request),
      parsed.email,
      parsed.firstName,
      lines,
    );
    return withCartSessionCookie(abandonedCartOk(), result.sessionToken);
  } catch (error) {
    console.error("[abandoned-cart] identify failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return abandonedCartOk();
  }
}
