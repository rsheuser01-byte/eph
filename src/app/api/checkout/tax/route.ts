import { NextResponse } from "next/server";
import { buildOrder } from "@/lib/checkout/order";
import { orderTotals } from "@/lib/checkout/pricing";
import {
  ProductionConfigurationError,
  assertProductionCheckoutReady,
  publicCheckoutUnavailableMessage,
} from "@/lib/config/productionReadiness";
import { getOrderStore } from "@/lib/orders";
import {
  getPromoStore,
  proportionallyDiscountedUnitPrices,
  resolvePromo,
} from "@/lib/promo";
import { hasApprovedOrderForEmail } from "@/lib/promo/orderEligibility";
import { TaxCalculationError, quoteTax } from "@/lib/tax";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Server-side tax quote for checkout UI.
 * Never accepts a client tax or discount amount — only destination + cart + optional code.
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

  const customer =
    typeof body.customer === "object" && body.customer !== null
      ? (body.customer as Record<string, unknown>)
      : null;
  const country = str(customer?.country) || "US";
  const state = str(customer?.state);
  const city = str(customer?.city);
  const zip = str(customer?.zip);
  const address1 = str(customer?.address1);
  if (!state || !city || !zip || !address1) {
    return NextResponse.json(
      { error: "Shipping address is required to calculate tax." },
      { status: 400 },
    );
  }

  let discount = 0;
  let appliedPromoCode: string | undefined;
  let promoLabel: string | undefined;
  const promoCode = str(body.promoCode);
  if (promoCode) {
    const email = str(body.email) || str(customer?.email);
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
    discount = resolved.discount;
    appliedPromoCode = resolved.promo.code;
    promoLabel = resolved.promo.label;
  }

  const discountedUnitPrices = proportionallyDiscountedUnitPrices(
    order.items,
    discount,
  );

  try {
    const quote = await quoteTax({
      customer: { country, state, city, zip, address1 },
      items: order.items.map((item, index) => ({
        sku: item.sku,
        quantity: item.qty,
        unitPrice: discountedUnitPrices[index] ?? item.unitPrice,
      })),
      shipping: order.shipping,
    });
    const totals = orderTotals(order.subtotal, quote.amount, discount);
    return NextResponse.json({
      tax: totals.tax,
      shipping: totals.shipping,
      subtotal: totals.subtotal,
      discount: totals.discount,
      promoCode: appliedPromoCode ?? null,
      label: promoLabel ?? null,
      total: totals.total,
      provider: quote.provider,
      jurisdiction: quote.jurisdiction ?? null,
    });
  } catch (error) {
    if (error instanceof TaxCalculationError) {
      return NextResponse.json(
        { error: "Unable to calculate sales tax. Please try again." },
        { status: 503 },
      );
    }
    throw error;
  }
}
