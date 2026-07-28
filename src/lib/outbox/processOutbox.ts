import { site } from "@/data/site";
import { getEmailProvider } from "@/lib/email";
import type { EmailMessage } from "@/lib/email/types";
import {
  buildCustomerConfirmation,
  buildStoreNotification,
} from "@/lib/email/orderConfirmation";
import {
  buildCancelledEmail,
  buildRefundEmail,
  buildShippedEmail,
} from "@/lib/email/orderNotifications";
import { storeNotificationEmail } from "@/lib/email/storeRecipient";
import { getOrderStore } from "@/lib/orders";
import type { OrderRecord, OrderStore } from "@/lib/orders/types";
import { getEmailDeliveryStore, getOutboxStore } from "./store";
import {
  ORDER_CANCELLED_EVENT,
  ORDER_PAID_EVENT,
  ORDER_REFUNDED_EVENT,
  ORDER_SHIPPED_EVENT,
  OUTBOX_MAX_ATTEMPTS,
  type EmailDeliveryStore,
  type OutboxEventRecord,
  type OutboxStore,
} from "./types";

export type ProcessOutboxResult = {
  processed: number;
  completed: number;
  retried: number;
  failed: number;
};

export type ProcessOutboxDeps = {
  outbox?: OutboxStore;
  emailDeliveries?: EmailDeliveryStore;
  orderStore?: OrderStore;
  send?: (message: EmailMessage) => Promise<void>;
  batchSize?: number;
  log?: (message: string, detail?: Record<string, unknown>) => void;
};

function orderEmailData(order: OrderRecord) {
  return {
    orderId: order.orderId,
    items: order.items,
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    customer: order.customer,
    siteName: site.name,
  };
}

async function sendOnce(
  deliveries: EmailDeliveryStore,
  eventType: string,
  orderId: string,
  message: EmailMessage,
  send: (message: EmailMessage) => Promise<void>,
): Promise<void> {
  const shouldSend = await deliveries.claimDelivery(
    eventType,
    orderId,
    message.to,
  );
  if (!shouldSend) {
    return;
  }
  try {
    await send(message);
  } catch (error) {
    if (deliveries.clearDeliveries) {
      await deliveries.clearDeliveries(eventType, orderId).catch(() => undefined);
    }
    throw error;
  }
}

async function handleOrderPaid(
  event: OutboxEventRecord,
  deps: Required<
    Pick<
      ProcessOutboxDeps,
      "emailDeliveries" | "orderStore" | "send" | "log"
    >
  >,
): Promise<void> {
  const orderId = String(event.payload.orderId ?? event.aggregateId);
  const order = await deps.orderStore.get(orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found for outbox event`);
  }

  const emailData = orderEmailData(order);
  await sendOnce(
    deps.emailDeliveries,
    "order.paid.customer",
    orderId,
    buildCustomerConfirmation(emailData),
    deps.send,
  );
  await sendOnce(
    deps.emailDeliveries,
    "order.paid.store",
    orderId,
    buildStoreNotification(emailData, storeNotificationEmail()),
    deps.send,
  );
}

async function handleOrderShipped(
  event: OutboxEventRecord,
  deps: Required<
    Pick<ProcessOutboxDeps, "emailDeliveries" | "orderStore" | "send">
  >,
): Promise<void> {
  const orderId = String(event.payload.orderId ?? event.aggregateId);
  const order = await deps.orderStore.get(orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found for outbox event`);
  }

  await sendOnce(
    deps.emailDeliveries,
    "order.shipped.customer",
    orderId,
    buildShippedEmail(orderEmailData(order), {
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
    }),
    deps.send,
  );
}

async function handleOrderRefunded(
  event: OutboxEventRecord,
  deps: Required<
    Pick<ProcessOutboxDeps, "emailDeliveries" | "orderStore" | "send">
  >,
): Promise<void> {
  const orderId = String(event.payload.orderId ?? "");
  if (!orderId) {
    throw new Error("order.refunded payload missing orderId");
  }
  const order = await deps.orderStore.get(orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found for outbox event`);
  }

  const refundedAmount = Number(event.payload.refundedAmount ?? 0);
  const totalRefunded = Number(
    event.payload.totalRefunded ?? order.refundedAmount,
  );
  const partial = Boolean(event.payload.partial);
  const deliveryKey = `order.refunded.customer:${Math.round(refundedAmount * 100)}:${totalRefunded}`;

  await sendOnce(
    deps.emailDeliveries,
    deliveryKey,
    orderId,
    buildRefundEmail(orderEmailData(order), {
      refundedAmount,
      totalRefunded,
      partial,
    }),
    deps.send,
  );
}

async function handleOrderCancelled(
  event: OutboxEventRecord,
  deps: Required<
    Pick<ProcessOutboxDeps, "emailDeliveries" | "orderStore" | "send">
  >,
): Promise<void> {
  const orderId = String(event.payload.orderId ?? event.aggregateId);
  const order = await deps.orderStore.get(orderId);
  if (!order) {
    throw new Error(`Order ${orderId} not found for outbox event`);
  }

  await sendOnce(
    deps.emailDeliveries,
    "order.cancelled.customer",
    orderId,
    buildCancelledEmail(orderEmailData(order)),
    deps.send,
  );
}

async function alertFailedOutbox(
  event: OutboxEventRecord,
  errorMessage: string,
  send: (message: EmailMessage) => Promise<void>,
  deliveries: EmailDeliveryStore,
): Promise<void> {
  const orderId = event.aggregateId;
  const message: EmailMessage = {
    to: storeNotificationEmail(),
    subject: `[${site.name}] Paid order needs attention: ${orderId}`,
    text: `Outbox event ${event.eventType} for order ${orderId} failed after ${event.attempts} attempts.\n\nLast error: ${errorMessage}\n\nThe order should still be visible in admin. Investigate email/side effects manually.`,
    html: `<p>Outbox event <code>${event.eventType}</code> for order <code>${orderId}</code> failed after ${event.attempts} attempts.</p><p>Last error: ${errorMessage}</p><p>The order should still be visible in admin. Investigate email/side effects manually.</p>`,
  };
  try {
    await sendOnce(
      deliveries,
      "outbox.failed.alert",
      orderId,
      message,
      send,
    );
  } catch (error) {
    console.error("Failed to send outbox failure alert", error);
  }
}

export async function processOutbox(
  deps: ProcessOutboxDeps = {},
): Promise<ProcessOutboxResult> {
  const outbox = deps.outbox ?? getOutboxStore();
  const emailDeliveries = deps.emailDeliveries ?? getEmailDeliveryStore();
  const orderStore = deps.orderStore ?? getOrderStore();
  const send =
    deps.send ?? ((message: EmailMessage) => getEmailProvider().send(message));
  const log =
    deps.log ?? ((message, detail) => console.error(message, detail));
  const batchSize = deps.batchSize ?? 20;

  const result: ProcessOutboxResult = {
    processed: 0,
    completed: 0,
    retried: 0,
    failed: 0,
  };

  let claimed: OutboxEventRecord[];
  try {
    claimed = await outbox.claimDue(batchSize);
  } catch (error) {
    log("outbox_claim_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    result.failed += 1;
    return result;
  }

  const handlerDeps = { emailDeliveries, orderStore, send, log };

  for (const event of claimed) {
    result.processed += 1;
    try {
      switch (event.eventType) {
        case ORDER_PAID_EVENT:
          await handleOrderPaid(event, handlerDeps);
          break;
        case ORDER_SHIPPED_EVENT:
          await handleOrderShipped(event, handlerDeps);
          break;
        case ORDER_REFUNDED_EVENT:
          await handleOrderRefunded(event, handlerDeps);
          break;
        case ORDER_CANCELLED_EVENT:
          await handleOrderCancelled(event, handlerDeps);
          break;
        default:
          throw new Error(`Unsupported outbox event type: ${event.eventType}`);
      }
      await outbox.markCompleted(event.id);
      result.completed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      log("outbox_event_failed", {
        id: event.id,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        attempts: event.attempts,
        message,
      });

      if (event.attempts >= OUTBOX_MAX_ATTEMPTS) {
        await outbox.markFailed(event.id, message);
        await alertFailedOutbox(event, message, send, emailDeliveries);
        result.failed += 1;
      } else {
        await outbox.markRetry(event.id, message, event.attempts);
        result.retried += 1;
      }
    }
  }

  return result;
}
