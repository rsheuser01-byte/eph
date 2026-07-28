import { NextResponse } from "next/server";
import { buildOrder } from "@/lib/checkout/order";
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

  const billing = parseBilling(body.customer);
  if (!billing) {
    return NextResponse.json(
      { error: "Missing or invalid shipping details." },
      { status: 400 },
    );
  }

  const orderId = generateOrderId();
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
    // Persist pending order first so reservation metadata has an order row.
    await persistOrder(
      approvedOrderDefaults({
        orderId,
        createdAt: new Date().toISOString(),
        provider: provider.name,
        paymentStatus: "pending",
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        currency: "USD",
        customer: billing,
        reservationExpiresAt: expiresAt.toISOString(),
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
      amount: order.total,
      currency: "USD",
      billing,
      card,
      items: order.items,
    });

    if (outcome.kind === "redirect") {
      return NextResponse.json({ redirectUrl: outcome.url, orderId });
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
      total: order.total,
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
