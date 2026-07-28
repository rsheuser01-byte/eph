import { NextResponse } from "next/server";
import { site } from "@/data/site";
import { buildOrder } from "@/lib/checkout/order";
import { getEmailProvider } from "@/lib/email";
import {
  buildCustomerConfirmation,
  buildStoreNotification,
  type OrderEmailData,
} from "@/lib/email/orderConfirmation";
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
import {
  reserveStock,
  releaseStock,
  stockItemsFromOrder,
} from "@/lib/inventory";

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

// Email failures must never void a paid order, so errors are logged, not thrown.
async function sendOrderEmails(data: OrderEmailData): Promise<void> {
  try {
    const email = getEmailProvider();
    await email.send(buildCustomerConfirmation(data));
    await email.send(buildStoreNotification(data, site.email));
  } catch (error) {
    console.error(`Order ${data.orderId} confirmation email failed:`, error);
  }
}

// Persistence failures are logged but never void a paid order.
async function persistOrder(record: OrderRecord): Promise<void> {
  try {
    await getOrderStore().save(record);
  } catch (error) {
    console.error(`Order ${record.orderId} could not be saved:`, error);
  }
}

export async function POST(request: Request) {
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
  let stockReserved = false;

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
    try {
      await reserveStock(stockItems, orderId);
      stockReserved = true;
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
        }),
      );
      return NextResponse.json({ redirectUrl: outcome.url, orderId });
    }

    if (!outcome.approved) {
      if (stockReserved) {
        await releaseStock(stockItems, orderId).catch((releaseError) => {
          console.error(`Failed to release stock for ${orderId}:`, releaseError);
        });
      }
      return NextResponse.json(
        { error: outcome.message ?? "Payment was declined." },
        { status: 402 },
      );
    }

    await persistOrder(
      approvedOrderDefaults({
        orderId: outcome.orderId,
        createdAt: new Date().toISOString(),
        provider: provider.name,
        transactionId: outcome.transactionId,
        paymentStatus: "approved",
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        currency: "USD",
        customer: billing,
      }),
    );

    await sendOrderEmails({
      orderId: outcome.orderId,
      items: order.items,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      customer: billing,
      siteName: site.name,
    });

    return NextResponse.json({
      status: "approved",
      orderId: outcome.orderId,
      transactionId: outcome.transactionId,
      total: order.total,
    });
  } catch (error) {
    if (stockReserved) {
      await releaseStock(stockItems, orderId).catch((releaseError) => {
        console.error(`Failed to release stock for ${orderId}:`, releaseError);
      });
    }
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Payment processing failed. Please try again." },
      { status: 500 },
    );
  }
}
