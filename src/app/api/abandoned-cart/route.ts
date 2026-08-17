import { NextResponse } from "next/server";
import { parseCartSyncRequest } from "@/lib/abandonedCart/parseRequest";
import { readCartSessionToken } from "@/lib/abandonedCart/cookie";
import {
  abandonedCartOk,
  withCartSessionCookie,
} from "@/lib/abandonedCart/http";
import { upsertSavedCart } from "@/lib/abandonedCart/service";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Persist the current browser cart server-side for recovery.
 * Non-critical: failures are logged and shopping continues.
 */
export async function POST(request: Request) {
  const limited = await checkRateLimit(
    "abandonedCartSync",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.abandonedCartSync,
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

  const parsed = parseCartSyncRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await upsertSavedCart(
      readCartSessionToken(request),
      parsed.items,
    );
    return withCartSessionCookie(abandonedCartOk(), result.sessionToken);
  } catch (error) {
    console.error("[abandoned-cart] sync failed", {
      error: error instanceof Error ? error.name : "unknown",
    });
    return abandonedCartOk();
  }
}
