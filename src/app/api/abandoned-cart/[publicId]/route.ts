import { NextResponse } from "next/server";
import { authorizeAbandonedCartApi } from "@/lib/abandonedCart/auth";
import { getAbandonedCartEmailData } from "@/lib/abandonedCart/service";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ publicId: string }> };

/**
 * Current cart data for an Activepieces recovery email.
 * Requires Authorization: Bearer ACTIVEPIECES_CART_API_SECRET.
 */
export async function GET(request: Request, context: RouteContext) {
  const limited = await checkRateLimit(
    "abandonedCartApi",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.abandonedCartApi,
  );
  if (!limited.allowed) {
    return tooManyRequestsResponse();
  }

  if (!authorizeAbandonedCartApi(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { publicId } = await context.params;
  if (!publicId?.trim()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const data = await getAbandonedCartEmailData(publicId);
  if (!data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}
