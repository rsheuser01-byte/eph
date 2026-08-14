import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getOrderStore } from "@/lib/orders";
import { getPaymentEventStore } from "@/lib/payments/paymentEvents";
import { createStripeClient } from "@/lib/payments/stripe";
import { enqueueOrderPaid } from "@/lib/outbox/enqueue";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";
import {
  logStripeWebhookSecurityEvent,
  processStripeWebhookEvent,
} from "./processWebhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe Checkout webhook.
 *
 * Verifies the Stripe-Signature header, retrieves the Checkout Session from
 * Stripe, reconciles amount/currency in integer cents against the stored
 * order, and is idempotent via payment_events.
 */
export async function POST(request: Request) {
  const limited = await checkRateLimit(
    "stripeWebhook",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.stripeWebhook,
  );
  if (!limited.allowed) {
    return tooManyRequestsResponse();
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    logStripeWebhookSecurityEvent("stripe_webhook_signature_rejected", {
      reason: "missing_signature",
    });
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    logStripeWebhookSecurityEvent("stripe_webhook_signature_rejected", {
      reason: "missing_webhook_secret",
    });
    return NextResponse.json(
      { error: "Webhook is not configured." },
      { status: 503 },
    );
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = createStripeClient().webhooks.constructEvent(
      payload,
      signature,
      secret,
    );
  } catch {
    logStripeWebhookSecurityEvent("stripe_webhook_signature_rejected", {
      reason: "invalid_signature",
    });
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const result = await processStripeWebhookEvent(event, {
    orderStore: getOrderStore(),
    paymentEvents: getPaymentEventStore(),
    enqueuePaid: enqueueOrderPaid,
    logSecurityEvent: logStripeWebhookSecurityEvent,
  });

  return NextResponse.json(result.body, { status: result.status });
}
