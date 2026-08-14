import { processOutbox } from "./processOutbox";
import { getOutboxStore } from "./store";
import {
  ORDER_CANCELLED_EVENT,
  ORDER_PAID_EVENT,
  ORDER_REFUNDED_EVENT,
  ORDER_SHIPPED_EVENT,
} from "./types";

/**
 * Send queued emails now. Cron remains a retry backup if this fails.
 * Never throw — payment/fulfillment already succeeded.
 */
async function flushOutbox(): Promise<void> {
  try {
    await processOutbox();
  } catch (error) {
    console.error("[outbox] immediate process failed", error);
  }
}

/**
 * Enqueue durable side effects for a paid order, then send confirmation immediately.
 * Safe to call multiple times for the same order (unique on event_type+aggregate_id).
 */
export async function enqueueOrderPaid(orderId: string): Promise<void> {
  const store = getOutboxStore();
  await store.enqueue({
    eventType: ORDER_PAID_EVENT,
    aggregateId: orderId,
    payload: {
      orderId,
      enqueuedAt: new Date().toISOString(),
    },
  });
  await flushOutbox();
}

export async function enqueueOrderShipped(orderId: string): Promise<void> {
  const store = getOutboxStore();
  await store.enqueue({
    eventType: ORDER_SHIPPED_EVENT,
    aggregateId: orderId,
    payload: {
      orderId,
      enqueuedAt: new Date().toISOString(),
    },
  });
  await flushOutbox();
}

/** One outbox row per refund tranche (aggregate includes cents). */
export async function enqueueOrderRefunded(
  orderId: string,
  refundedAmount: number,
  totalRefunded: number,
  partial: boolean,
): Promise<void> {
  const store = getOutboxStore();
  const cents = Math.round(refundedAmount * 100);
  await store.enqueue({
    eventType: ORDER_REFUNDED_EVENT,
    aggregateId: `${orderId}:${cents}:${Date.now()}`,
    payload: {
      orderId,
      refundedAmount,
      totalRefunded,
      partial,
      enqueuedAt: new Date().toISOString(),
    },
  });
  await flushOutbox();
}

export async function enqueueOrderCancelled(orderId: string): Promise<void> {
  const store = getOutboxStore();
  await store.enqueue({
    eventType: ORDER_CANCELLED_EVENT,
    aggregateId: orderId,
    payload: {
      orderId,
      enqueuedAt: new Date().toISOString(),
    },
  });
  await flushOutbox();
}
