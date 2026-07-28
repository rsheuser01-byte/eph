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
import type { OrderRecord } from "@/lib/orders/types";
import { getEmailDeliveryStore } from "@/lib/outbox/store";

export type ResendEmailKind =
  | "confirmation"
  | "shipped"
  | "refund"
  | "cancelled";

function emailData(order: OrderRecord) {
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

/**
 * Intentionally resend a customer (and store, for confirmation) email.
 * Clears prior delivery claims for the matching keys so send is allowed.
 */
export async function resendOrderEmail(
  order: OrderRecord,
  kind: ResendEmailKind,
): Promise<{ sent: number }> {
  const deliveries = getEmailDeliveryStore();
  const send = (message: EmailMessage) => getEmailProvider().send(message);
  const data = emailData(order);
  let sent = 0;

  if (kind === "confirmation") {
    if (deliveries.clearDeliveries) {
      await deliveries.clearDeliveries("order.paid.customer", order.orderId);
      await deliveries.clearDeliveries("order.paid.store", order.orderId);
    }
    const customer = buildCustomerConfirmation(data);
    const storeMsg = buildStoreNotification(data, storeNotificationEmail());
    if (
      await deliveries.claimDelivery(
        "order.paid.customer",
        order.orderId,
        customer.to,
      )
    ) {
      await send(customer);
      sent += 1;
    }
    if (
      await deliveries.claimDelivery(
        "order.paid.store",
        order.orderId,
        storeMsg.to,
      )
    ) {
      await send(storeMsg);
      sent += 1;
    }
    return { sent };
  }

  if (kind === "shipped") {
    if (deliveries.clearDeliveries) {
      await deliveries.clearDeliveries("order.shipped.customer", order.orderId);
    }
    const message = buildShippedEmail(data, {
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
    });
    if (
      await deliveries.claimDelivery(
        "order.shipped.customer",
        order.orderId,
        message.to,
      )
    ) {
      await send(message);
      sent += 1;
    }
    return { sent };
  }

  if (kind === "cancelled") {
    if (deliveries.clearDeliveries) {
      await deliveries.clearDeliveries(
        "order.cancelled.customer",
        order.orderId,
      );
    }
    const message = buildCancelledEmail(data);
    if (
      await deliveries.claimDelivery(
        "order.cancelled.customer",
        order.orderId,
        message.to,
      )
    ) {
      await send(message);
      sent += 1;
    }
    return { sent };
  }

  const partial = order.paymentStatus === "partially_refunded";
  const deliveryKey = `order.refunded.customer.resend:${Date.now()}`;
  const message = buildRefundEmail(data, {
    refundedAmount: order.refundedAmount,
    totalRefunded: order.refundedAmount,
    partial,
  });
  if (await deliveries.claimDelivery(deliveryKey, order.orderId, message.to)) {
    await send(message);
    sent += 1;
  }
  return { sent };
}
