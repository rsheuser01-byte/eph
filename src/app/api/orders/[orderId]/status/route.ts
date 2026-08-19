import { NextResponse } from "next/server";
import { loadPublicOrderStatus } from "@/lib/orders/loadPublicStatus";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

/**
 * Customer-facing order status. Requires opaque lookup token.
 * Omits billing address and payment details. After payment, may include
 * the order owner's email/name for a Trustpilot review invitation.
 */
export async function GET(request: Request, context: RouteContext) {
  const limited = await checkRateLimit(
    "orderStatus",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.orderStatus,
  );
  if (!limited.allowed) {
    return tooManyRequestsResponse();
  }

  const { orderId: rawOrderId } = await context.params;
  const orderId = decodeURIComponent(rawOrderId);
  const token = new URL(request.url).searchParams.get("token") ?? "";

  const headers = { "Cache-Control": "no-store" };
  const status = await loadPublicOrderStatus(orderId, token);
  if (!status) {
    return NextResponse.json({ error: "Not found." }, { status: 404, headers });
  }

  return NextResponse.json(
    {
      orderId: status.orderId,
      paymentStatus: status.paymentStatus,
      fulfillmentStatus: status.fulfillmentStatus,
      headline: status.headline,
      message: status.message,
      poll: status.poll,
      ...(status.reviewInvitation
        ? { reviewInvitation: status.reviewInvitation }
        : {}),
    },
    { headers },
  );
}
