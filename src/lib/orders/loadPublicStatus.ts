import { getOrderStore } from "@/lib/orders";
import {
  lookupTokensEqual,
  publicStatusFromPayment,
  type PublicOrderStatus,
} from "@/lib/orders/publicStatus";

export async function loadPublicOrderStatus(
  orderId: string,
  token: string,
): Promise<PublicOrderStatus | null> {
  if (!orderId || !token) {
    return null;
  }
  const order = await getOrderStore().get(orderId);
  if (!order || !lookupTokensEqual(order.lookupToken, token)) {
    return null;
  }
  return publicStatusFromPayment(
    order.orderId,
    order.paymentStatus,
    order.fulfillmentStatus,
  );
}
