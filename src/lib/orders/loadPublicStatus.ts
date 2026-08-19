import { getOrderStore } from "@/lib/orders";
import {
  lookupTokensEqual,
  publicStatusFromPayment,
  type PublicOrderStatus,
} from "@/lib/orders/publicStatus";
import { confirmStripePaidOrder } from "@/lib/payments/confirmStripePaidOrder";
import { buildTrustpilotInvitation } from "@/lib/trustpilot/invitation";

export async function loadPublicOrderStatus(
  orderId: string,
  token: string,
): Promise<PublicOrderStatus | null> {
  if (!orderId || !token) {
    return null;
  }
  const store = getOrderStore();
  let order = await store.get(orderId);
  if (!order || !lookupTokensEqual(order.lookupToken, token)) {
    return null;
  }

  if (
    order.paymentStatus === "pending" &&
    order.provider === "stripe" &&
    order.transactionId?.startsWith("cs_")
  ) {
    try {
      await confirmStripePaidOrder(order.orderId);
      order = (await store.get(orderId)) ?? order;
    } catch (error) {
      console.error("[stripe] return-path confirm failed", {
        orderId,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  const status = publicStatusFromPayment(
    order.orderId,
    order.paymentStatus,
    order.fulfillmentStatus,
  );
  const reviewInvitation = buildTrustpilotInvitation(order);
  if (!reviewInvitation) {
    return status;
  }
  return { ...status, reviewInvitation };
}
