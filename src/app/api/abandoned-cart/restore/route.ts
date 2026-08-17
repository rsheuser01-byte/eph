import { NextResponse } from "next/server";
import { parseRestoreRequest } from "@/lib/abandonedCart/parseRequest";
import { restoreSavedCart } from "@/lib/abandonedCart/service";
import { withCartSessionCookie } from "@/lib/abandonedCart/http";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Redeem a restore token and return shoppable cart lines (current prices).
 */
export async function POST(request: Request) {
  const limited = await checkRateLimit(
    "abandonedCartRestore",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.abandonedCartRestore,
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

  const token = parseRestoreRequest(body);
  if (!token) {
    return NextResponse.json({ error: "A restore token is required." }, { status: 400 });
  }

  const result = await restoreSavedCart(token);
  if (!result.ok) {
    const status =
      result.reason === "expired"
        ? 410
        : result.reason === "converted"
          ? 409
          : 404;
    return NextResponse.json(
      { error: "This cart link is invalid or no longer available." },
      { status },
    );
  }

  const response = NextResponse.json({
    ok: true,
    lines: result.lines,
    droppedCount: result.droppedCount,
  });
  if (result.sessionToken) {
    return withCartSessionCookie(response, result.sessionToken);
  }
  return response;
}
