import type Stripe from "stripe";
import { getOrderStore } from "@/lib/orders";
import type { OrderStore } from "@/lib/orders/types";
import { enqueueOrderPaid } from "@/lib/outbox/enqueue";
import {
  applyPaidStripeSession,
  orderIdFromStripeSession,
} from "@/lib/payments/applyPaidStripeSession";
import { createStripeClient } from "@/lib/payments/stripe";

export type ConfirmStripePaidOrderDeps = {
  orderStore?: OrderStore;
  retrieveSession?: (sessionId: string) => Promise<Stripe.Checkout.Session>;
  enqueuePaid?: (orderId: string) => Promise<void>;
  commitStock?: (orderId: string) => Promise<void>;
  logSecurityEvent?: (event: string, detail: Record<string, unknown>) => void;
};

/**
 * If a pending Stripe order's Checkout Session is already paid, fulfill it.
 * Used when the customer returns to /checkout/success before the webhook arrives
 * (common on localhost without `stripe listen`).
 */
export async function confirmStripePaidOrder(
  orderId: string,
  deps: ConfirmStripePaidOrderDeps = {},
): Promise<"approved" | "pending" | "skipped"> {
  const orderStore = deps.orderStore ?? getOrderStore();
  const log =
    deps.logSecurityEvent ??
    ((event, detail) => {
      console.error(`[security] ${event}`, detail);
    });
  const order = await orderStore.get(orderId);

  if (!order || order.paymentStatus !== "pending") {
    return "skipped";
  }
  if (order.provider !== "stripe") {
    return "skipped";
  }
  const sessionId = order.transactionId?.trim() ?? "";
  if (!sessionId.startsWith("cs_")) {
    return "skipped";
  }

  const retrieve =
    deps.retrieveSession ??
    ((id: string) => createStripeClient().checkout.sessions.retrieve(id));

  let session: Stripe.Checkout.Session;
  try {
    session = await retrieve(sessionId);
  } catch (error) {
    log("stripe_return_retrieve_failed", {
      orderId,
      sessionId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return "pending";
  }

  const sessionOrderId = orderIdFromStripeSession(session);
  if (sessionOrderId && sessionOrderId !== order.orderId) {
    log("stripe_return_order_mismatch", {
      orderId,
      sessionId,
      sessionOrderId,
    });
    return "pending";
  }

  if (session.payment_status !== "paid") {
    return "pending";
  }

  const result = await applyPaidStripeSession(order, session, {
    orderStore,
    enqueuePaid: deps.enqueuePaid ?? enqueueOrderPaid,
    logSecurityEvent: log,
    commitStock: deps.commitStock,
  });

  return result.outcome === "approved" || result.outcome === "already"
    ? "approved"
    : "pending";
}
