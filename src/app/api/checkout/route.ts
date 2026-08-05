import { NextResponse } from "next/server";
import { buildOrder } from "@/lib/checkout/order";
import { orderTotals } from "@/lib/checkout/pricing";
import {
  approvedOrderDefaults,
  getOrderStore,
  type OrderRecord,
} from "@/lib/orders";
import {
  getPaymentProvider,
  paymentProviderRequiresCard,
} from "@/lib/payments";
import type { BillingInfo, CardInput } from "@/lib/payments/types";
import { stockItemsFromOrder } from "@/lib/inventory";
import {
  commitReservations,
  createReservations,
  releaseReservations,
  reservationExpiresAt,
} from "@/lib/inventory/reservations";
import {
  ProductionConfigurationError,
  assertProductionCheckoutReady,
  publicCheckoutUnavailableMessage,
} from "@/lib/config/productionReadiness";
import { enqueueOrderPaid } from "@/lib/outbox/enqueue";
import { generateLookupToken } from "@/lib/orders/publicStatus";
import {
  getPromoStore,
  proportionallyDiscountedUnitPrices,
  resolvePromo,
} from "@/lib/promo";
import { hasApprovedOrderForEmail } from "@/lib/promo/orderEligibility";
import { TaxCalculationError, quoteTax } from "@/lib/tax";
import { researchUseAckError } from "@/lib/checkout/researchAck";
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

function parseBilling(input: unknown): BillingInfo | null {
  if (typeof input !== "object" || input === null) {
    return null;
  }
  const record = input as Record<string, unknown>;
  const billing: BillingInfo = {
    firstName: str(record.firstName),
    lastName: str(record.lastName),
    email: str(record.email),
    phone: str(record.phone),
    address1: str(record.address1),
    address2: str(record.address2),
    city: str(record.city),
    state: str(record.state),
    zip: str(record.zip),
    country: str(record.country) || "US",
  };
  const required = [
    billing.firstName,
    billing.lastName,
    billing.email,
    billing.address1,
    billing.city,
    billing.state,
    billing.zip,
  ];
  if (required.some((field) => field.length === 0)) {
    return null;
  }
  if (!billing.email.includes("@")) {
    return null;
  }
  return billing;
}

function parseCard(input: unknown): CardInput | null {
  if (typeof input !== "object" || input === null) {
    return null;
  }
  const record = input as Record<string, unknown>;
  const card: CardInput = {
    number: str(record.number).replace(/\s/g, ""),
    expiryMonth: str(record.expiryMonth),
    expiryYear: str(record.expiryYear),
    cvv: str(record.cvv),
  };
  const digits = card.number.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) {
    return null;
  }
  if (!/^\d{1,2}$/.test(card.expiryMonth) || !/^\d{4}$/.test(card.expiryYear)) {
    return null;
  }
  if (!/^\d{3,4}$/.test(card.cvv)) {
    return null;
  }
  return card;
}

function generateOrderId(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EPH-${Date.now().toString(36).toUpperCase()}-${random}`;
}

async function persistOrder(record: OrderRecord): Promise<void> {
  await getOrderStore().save(record);
}

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
    "checkout",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.checkout,
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

  const ackError = researchUseAckError(body);
  if (ackError) {
    return NextResponse.json({ error: ackError }, { status: 400 });
  }

  // Client-supplied tax is ignored — always recompute server-side.
  const order = buildOrder(body.items);
  if (!order.ok) {
    return NextResponse.json({ error: order.error }, { status: 400 });
  }

  const billing = parseBilling(body.customer);
  if (!billing) {
    return NextResponse.json(
      { error: "Missing or invalid shipping details." },
      { status: 400 },
    );
  }

  let discount = 0;
  let appliedPromoCode: string | undefined;
  const promoCode = str(body.promoCode);
  if (promoCode) {
    const orderStoreForPromo = getOrderStore();
    const resolved = await resolvePromo({
      promoCode,
      email: billing.email,
      subtotal: order.subtotal,
      promoStore: getPromoStore(),
      hasApprovedOrderForEmail: (e) =>
        hasApprovedOrderForEmail(orderStoreForPromo, e),
    });
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }
    discount = resolved.discount;
    appliedPromoCode = resolved.promo.code;
  }

  const discountedUnitPrices = proportionallyDiscountedUnitPrices(
    order.items,
    discount,
  );

  let taxQuote;
  try {
    taxQuote = await quoteTax({
      customer: {
        country: billing.country,
        state: billing.state,
        city: billing.city,
        zip: billing.zip,
        address1: billing.address1,
      },
      items: order.items.map((item, index) => ({
        sku: item.sku,
        quantity: item.qty,
        unitPrice: discountedUnitPrices[index] ?? item.unitPrice,
      })),
      shipping: order.shipping,
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

  const totals = orderTotals(order.subtotal, taxQuote.amount, discount);
  const orderId = generateOrderId();
  const lookupToken = generateLookupToken();
  const provider = getPaymentProvider();
  const stockItems = stockItemsFromOrder(order.items);
  let reserved = false;
  const expiresAt = reservationExpiresAt();

  let card: CardInput | undefined;
  if (paymentProviderRequiresCard(provider.name)) {
    const parsed = parseCard(body.card);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid card details." },
        { status: 400 },
      );
    }
    card = parsed;
  }

  try {
    await persistOrder(
      approvedOrderDefaults({
        orderId,
        createdAt: new Date().toISOString(),
        provider: provider.name,
        paymentStatus: "pending",
        items: order.items,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        tax: totals.tax,
        discount: totals.discount,
        promoCode: appliedPromoCode,
        total: totals.total,
        currency: "USD",
        customer: billing,
        reservationExpiresAt: expiresAt.toISOString(),
        lookupToken,
        taxProvider: taxQuote.provider,
        taxQuoteId: taxQuote.quoteId,
        taxJurisdiction: taxQuote.jurisdiction,
      }),
    );

    try {
      await createReservations(stockItems, orderId, expiresAt);
      reserved = true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Insufficient stock.";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    const outcome = await provider.beginCheckout({
      orderId,
      amount: totals.total,
      currency: "USD",
      billing,
      card,
      items: order.items,
      lookupToken,
    });

    if (outcome.kind === "redirect") {
      return NextResponse.json({
        redirectUrl: outcome.url,
        orderId,
        lookupToken,
      });
    }

    const store = getOrderStore();

    if (!outcome.approved) {
      if (reserved) {
        await releaseReservations(orderId).catch((releaseError) => {
          console.error(`Failed to release reservation for ${orderId}:`, releaseError);
        });
      }
      if (store.updateStatus) {
        await store.updateStatus(orderId, { paymentStatus: "declined" });
      }
      return NextResponse.json(
        { error: outcome.message ?? "Payment was declined." },
        { status: 402 },
      );
    }

    try {
      await commitReservations(orderId);
    } catch (error) {
      console.error(`Failed to commit reservation for ${orderId}:`, error);
      if (store.updateStatus) {
        await store.updateStatus(orderId, {
          paymentStatus: "review_required",
          transactionId: outcome.transactionId,
        });
      }
      return NextResponse.json(
        { error: "Payment received but inventory could not be confirmed. We will contact you." },
        { status: 409 },
      );
    }

    if (store.updateStatus) {
      await store.updateStatus(orderId, {
        paymentStatus: "approved",
        transactionId: outcome.transactionId,
      });
    }

    try {
      await enqueueOrderPaid(outcome.orderId);
    } catch (error) {
      console.error(`Failed to enqueue order.paid for ${orderId}:`, error);
    }

    return NextResponse.json({
      status: "approved",
      orderId: outcome.orderId,
      transactionId: outcome.transactionId,
      lookupToken,
      total: totals.total,
      tax: totals.tax,
    });
  } catch (error) {
    if (reserved) {
      await releaseReservations(orderId).catch((releaseError) => {
        console.error(`Failed to release reservation for ${orderId}:`, releaseError);
      });
    }
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Payment processing failed. Please try again." },
      { status: 500 },
    );
  }
}
