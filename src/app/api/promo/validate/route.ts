import { NextResponse } from "next/server";
import { buildOrder } from "@/lib/checkout/order";
import { orderTotals } from "@/lib/checkout/pricing";
import {
  ProductionConfigurationError,
  assertProductionCheckoutReady,
  publicCheckoutUnavailableMessage,
} from "@/lib/config/productionReadiness";
import { getOrderStore } from "@/lib/orders";
import { getPromoStore, resolvePromo } from "@/lib/promo";
import { hasApprovedOrderForEmail } from "@/lib/promo/orderEligibility";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Validate a customer-entered promo code against the cart.
 * Never trusts a client-supplied discount amount.
 */
export async function POST(request: Request) {
  try {
    assertProductionCheckoutReady();
  } catch (error) {
    if (error instanceof ProductionConfigurationError) {
      return NextResponse.json(
        { error: publicCheckoutUnavailableMessage },
        { status: 503 },
      );
    }
    throw error;
  }

  const limited = await checkRateLimit(
    "promoValidate",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.promoValidate,
  );
  if (!limited.allowed) {
    return tooManyRequestsResponse();
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const order = buildOrder(body.items);
  if (!order.ok) {
    return NextResponse.json({ error: order.error }, { status: 400 });
  }

  const promoCode = str(body.promoCode);
  const email = str(body.email);
  const orderStore = getOrderStore();
  const resolved = await resolvePromo({
    promoCode,
    email,
    subtotal: order.subtotal,
    promoStore: getPromoStore(),
    hasApprovedOrderForEmail: (e) => hasApprovedOrderForEmail(orderStore, e),
  });

  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const totals = orderTotals(order.subtotal, 0, resolved.discount);
  return NextResponse.json({
    promoCode: resolved.promo.code,
    label: resolved.promo.label,
    discount: totals.discount,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    total: totals.total,
  });
}
