import type Stripe from "stripe";
import type { OrderRecord, OrderStore } from "@/lib/orders/types";
import { commitReservations } from "@/lib/inventory/reservations";
import { toCents } from "@/lib/payments/money";

export type ApplyPaidStripeSessionDeps = {
  orderStore: OrderStore;
  enqueuePaid: (orderId: string) => Promise<void>;
  logSecurityEvent: (event: string, detail: Record<string, unknown>) => void;
  commitStock?: (orderId: string) => Promise<void>;
};

export type ApplyPaidStripeSessionResult =
  | { outcome: "approved" }
  | { outcome: "already" }
  | { outcome: "unpaid" }
  | { outcome: "amount_mismatch" }
  | { outcome: "currency_mismatch" }
  | { outcome: "inventory" };

export function orderIdFromStripeSession(
  session: Stripe.Checkout.Session,
): string {
  return (
    session.client_reference_id?.trim() ||
    session.metadata?.orderId?.trim() ||
    ""
  );
}

export function paymentIntentIdFromSession(
  session: Stripe.Checkout.Session,
): string | undefined {
  const value = session.payment_intent;
  if (!value) {
    return undefined;
  }
  return typeof value === "string" ? value : value.id;
}

/**
 * Approve a pending order after Stripe reports the Checkout Session paid.
 * Shared by the webhook and the success-page return path.
 */
export async function applyPaidStripeSession(
  order: OrderRecord,
  session: Stripe.Checkout.Session,
  deps: ApplyPaidStripeSessionDeps,
): Promise<ApplyPaidStripeSessionResult> {
  if (session.payment_status !== "paid") {
    return { outcome: "unpaid" };
  }

  const orderId = order.orderId;
  const commitStock = deps.commitStock ?? commitReservations;
  const transactionId = paymentIntentIdFromSession(session) ?? session.id;

  if (order.paymentStatus === "approved") {
    return { outcome: "already" };
  }

  const expectedPreTaxCents =
    toCents(order.subtotal) - toCents(order.discount) + toCents(order.shipping);
  const taxCents = session.total_details?.amount_tax ?? 0;
  const actualCents = session.amount_total;
  const actualCurrency = (session.currency ?? "").toUpperCase();

  if (
    actualCents == null ||
    actualCents !== expectedPreTaxCents + taxCents
  ) {
    deps.logSecurityEvent("stripe_webhook_amount_mismatch", {
      orderId,
      expectedPreTaxCents,
      taxCents,
      actualCents,
    });
    if (deps.orderStore.updateStatus) {
      await deps.orderStore.updateStatus(orderId, {
        paymentStatus: "review_required",
      });
    }
    return { outcome: "amount_mismatch" };
  }

  if (actualCurrency !== order.currency.toUpperCase()) {
    deps.logSecurityEvent("stripe_webhook_currency_mismatch", {
      orderId,
      expected: order.currency,
      actual: actualCurrency,
    });
    if (deps.orderStore.updateStatus) {
      await deps.orderStore.updateStatus(orderId, {
        paymentStatus: "review_required",
      });
    }
    return { outcome: "currency_mismatch" };
  }

  try {
    await commitStock(orderId);
  } catch (error) {
    deps.logSecurityEvent("stripe_webhook_commit_stock_failed", {
      orderId,
      message: error instanceof Error ? error.message : "unknown",
    });
    if (deps.orderStore.updateStatus) {
      await deps.orderStore.updateStatus(orderId, {
        paymentStatus: "review_required",
        transactionId,
      });
    }
    return { outcome: "inventory" };
  }

  if (deps.orderStore.updateStatus) {
    await deps.orderStore.updateStatus(orderId, {
      paymentStatus: "approved",
      transactionId,
      tax: taxCents / 100,
      total: actualCents / 100,
      taxProvider: "stripe",
    });
  }

  try {
    await deps.enqueuePaid(orderId);
  } catch (error) {
    deps.logSecurityEvent("stripe_webhook_outbox_enqueue_failed", {
      orderId,
      message: error instanceof Error ? error.message : "unknown",
    });
  }

  return { outcome: "approved" };
}
