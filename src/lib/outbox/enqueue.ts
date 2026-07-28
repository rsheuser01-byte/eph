import { getOutboxStore } from "./store";
import { ORDER_PAID_EVENT } from "./types";

/**
 * Enqueue durable side effects for a paid order.
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
}
