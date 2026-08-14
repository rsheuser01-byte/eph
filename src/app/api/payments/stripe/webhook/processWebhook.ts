import type { OrderStore } from "@/lib/orders/types";
import type { PaymentEventStore } from "@/lib/payments/paymentEvents";
import {
  commitReservations,
  releaseReservations,
} from "@/lib/inventory/reservations";
import { alertCritical } from "@/lib/security/alerts";
import type Stripe from "stripe";
import {
  applyPaidStripeSession,
  orderIdFromStripeSession,
  paymentIntentIdFromSession,
} from "@/lib/payments/applyPaidStripeSession";
import { createStripeClient } from "@/lib/payments/stripe";

export type StripeWebhookProcessResult = {
  status: number;
  body: Record<string, unknown>;
};

export type StripeWebhookDependencies = {
  orderStore: OrderStore;
  paymentEvents: PaymentEventStore;
  enqueuePaid: (orderId: string) => Promise<void>;
  logSecurityEvent: (event: string, detail: Record<string, unknown>) => void;
  retrieveSession?: (
    sessionId: string,
  ) => Promise<Stripe.Checkout.Session>;
  commitStock?: (orderId: string) => Promise<void>;
  releaseStock?: (orderId: string) => Promise<void>;
};

const HANDLED_TYPES = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

function sessionFromEvent(
  event: Stripe.Event,
): Stripe.Checkout.Session | null {
  if (!HANDLED_TYPES.has(event.type)) {
    return null;
  }
  const object = event.data.object as Stripe.Checkout.Session;
  if (!object?.id || object.object !== "checkout.session") {
    return null;
  }
  return object;
}


function flattenSession(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
): Record<string, string> {
  return {
    eventId: event.id,
    eventType: event.type,
    sessionId: session.id,
    paymentStatus: session.payment_status ?? "",
    sessionStatus: session.status ?? "",
    amountTotal: String(session.amount_total ?? ""),
    currency: session.currency ?? "",
    orderId: orderIdFromStripeSession(session),
    paymentIntent: paymentIntentIdFromSession(session) ?? "",
  };
}

export async function processStripeWebhookEvent(
  event: Stripe.Event,
  deps: StripeWebhookDependencies,
): Promise<StripeWebhookProcessResult> {
  const eventSession = sessionFromEvent(event);
  if (!eventSession) {
    return { status: 200, body: { ok: true, ignored: true } };
  }

  const orderIdHint = orderIdFromStripeSession(eventSession);
  const { event: stored, duplicate } = await deps.paymentEvents.insert({
    provider: "stripe",
    providerEventId: event.id,
    orderId: orderIdHint || null,
    transactionId: eventSession.id,
    eventType: event.type,
    signatureValid: true,
    processingStatus: "received",
    payload: flattenSession(event, eventSession),
  });

  if (
    duplicate ||
    stored.processingStatus === "processed" ||
    stored.processingStatus === "ignored_duplicate"
  ) {
    return { status: 200, body: { ok: true, duplicate: true } };
  }

  const retrieve =
    deps.retrieveSession ??
    ((sessionId: string) =>
      createStripeClient().checkout.sessions.retrieve(sessionId));

  let session: Stripe.Checkout.Session;
  try {
    session = await retrieve(eventSession.id);
  } catch (error) {
    deps.logSecurityEvent("stripe_webhook_retrieve_failed", {
      orderId: orderIdHint || null,
      sessionId: eventSession.id,
      message: error instanceof Error ? error.message : "unknown",
    });
    await deps.paymentEvents.markProcessed(stored.id, {
      processingStatus: "failed",
      errorMessage: "session_retrieve_failed",
    });
    return { status: 500, body: { error: "Session lookup failed." } };
  }

  const orderId = orderIdFromStripeSession(session);
  if (!orderId) {
    await deps.paymentEvents.markProcessed(stored.id, {
      processingStatus: "rejected",
      errorMessage: "missing_order_id",
    });
    deps.logSecurityEvent("stripe_webhook_missing_order_id", {
      sessionId: session.id,
    });
    return { status: 400, body: { error: "Missing order id." } };
  }

  const existing = await deps.orderStore.get(orderId);
  if (!existing) {
    await deps.paymentEvents.markProcessed(stored.id, {
      processingStatus: "rejected",
      errorMessage: "unknown_order",
    });
    deps.logSecurityEvent("stripe_webhook_unknown_order", {
      orderId,
      sessionId: session.id,
    });
    return { status: 404, body: { error: "Unknown order." } };
  }

  const commitStock = deps.commitStock ?? commitReservations;
  const releaseStock = deps.releaseStock ?? releaseReservations;
  const transactionId = paymentIntentIdFromSession(session) ?? session.id;

  if (event.type === "checkout.session.expired") {
    if (existing.paymentStatus === "approved") {
      deps.logSecurityEvent("stripe_webhook_illegal_transition", {
        orderId,
        from: existing.paymentStatus,
        eventType: event.type,
      });
      if (deps.orderStore.updateStatus) {
        await deps.orderStore.updateStatus(orderId, {
          paymentStatus: "review_required",
        });
      }
      await deps.paymentEvents.markProcessed(stored.id, {
        processingStatus: "processed",
        errorMessage: "expire_after_approve_flagged",
      });
      return { status: 200, body: { ok: true, reviewRequired: true } };
    }

    await releaseStock(orderId).catch((error) => {
      deps.logSecurityEvent("stripe_webhook_release_stock_failed", {
        orderId,
        message: error instanceof Error ? error.message : "unknown",
      });
    });
    if (deps.orderStore.updateStatus) {
      await deps.orderStore.updateStatus(orderId, {
        paymentStatus: "expired",
        transactionId: session.id,
      });
    }
    await deps.paymentEvents.markProcessed(stored.id, {
      processingStatus: "processed",
    });
    return { status: 200, body: { ok: true, expired: true } };
  }

  if (event.type === "checkout.session.async_payment_failed") {
    if (existing.paymentStatus === "approved") {
      deps.logSecurityEvent("stripe_webhook_illegal_transition", {
        orderId,
        from: existing.paymentStatus,
        eventType: event.type,
      });
      if (deps.orderStore.updateStatus) {
        await deps.orderStore.updateStatus(orderId, {
          paymentStatus: "review_required",
        });
      }
      await deps.paymentEvents.markProcessed(stored.id, {
        processingStatus: "processed",
        errorMessage: "fail_after_approve_flagged",
      });
      return { status: 200, body: { ok: true, reviewRequired: true } };
    }

    await releaseStock(orderId).catch((error) => {
      deps.logSecurityEvent("stripe_webhook_release_stock_failed", {
        orderId,
        message: error instanceof Error ? error.message : "unknown",
      });
    });
    if (deps.orderStore.updateStatus) {
      await deps.orderStore.updateStatus(orderId, {
        paymentStatus: "declined",
        transactionId,
      });
    }
    await deps.paymentEvents.markProcessed(stored.id, {
      processingStatus: "processed",
    });
    return { status: 200, body: { ok: true, approved: false } };
  }

  if (session.payment_status !== "paid") {
    await deps.paymentEvents.markProcessed(stored.id, {
      processingStatus: "processed",
      errorMessage: "awaiting_payment",
    });
    return { status: 200, body: { ok: true, pending: true } };
  }

  const paid = await applyPaidStripeSession(existing, session, {
    orderStore: deps.orderStore,
    enqueuePaid: deps.enqueuePaid,
    logSecurityEvent: deps.logSecurityEvent,
    commitStock,
  });

  if (paid.outcome === "already") {
    await deps.paymentEvents.markProcessed(stored.id, {
      processingStatus: "ignored_duplicate",
    });
    return { status: 200, body: { ok: true, duplicate: true } };
  }

  if (paid.outcome === "unpaid") {
    await deps.paymentEvents.markProcessed(stored.id, {
      processingStatus: "processed",
      errorMessage: "awaiting_payment",
    });
    return { status: 200, body: { ok: true, pending: true } };
  }

  if (paid.outcome === "amount_mismatch") {
    await deps.paymentEvents.markProcessed(stored.id, {
      processingStatus: "rejected",
      errorMessage: "amount_mismatch",
    });
    return { status: 422, body: { error: "Payment amount mismatch." } };
  }

  if (paid.outcome === "currency_mismatch") {
    await deps.paymentEvents.markProcessed(stored.id, {
      processingStatus: "rejected",
      errorMessage: "currency_mismatch",
    });
    return { status: 422, body: { error: "Payment currency mismatch." } };
  }

  if (paid.outcome === "inventory") {
    await deps.paymentEvents.markProcessed(stored.id, {
      processingStatus: "failed",
      errorMessage: "commit_stock_failed",
    });
    return {
      status: 409,
      body: { error: "Payment verified but inventory commit failed." },
    };
  }

  await deps.paymentEvents.markProcessed(stored.id, {
    processingStatus: "processed",
  });
  return { status: 200, body: { ok: true, approved: true } };
}

export function logStripeWebhookSecurityEvent(
  event: string,
  detail: Record<string, unknown>,
): void {
  console.error(`[security] ${event}`, detail);
  if (
    event === "stripe_webhook_signature_rejected" ||
    event === "stripe_webhook_amount_mismatch"
  ) {
    void alertCritical(
      event === "stripe_webhook_signature_rejected"
        ? "ipn.signature_failure"
        : "ipn.amount_mismatch",
      detail ?? {},
    );
  }
}
