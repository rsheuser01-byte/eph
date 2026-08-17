import type {
  AbandonedCartEmailItem,
  AbandonedCartEmailPayload,
  AbandonedCartStatusPayload,
  CartConvertedWebhookPayload,
  CheckoutIdentifiedWebhookPayload,
  SavedCart,
  SavedCartStatus,
} from "./types";
import {
  abandonedCartDataUrl,
  abandonedCartStatusUrl,
  convertedIdempotencyKey,
  identifiedIdempotencyKey,
  restoreCartUrl,
} from "./urls";

export function effectiveCartStatus(
  cart: SavedCart,
  nowMs = Date.now(),
): SavedCartStatus {
  if (cart.status === "converted") {
    return "converted";
  }
  if (cart.status === "expired" || Date.parse(cart.expiresAt) <= nowMs) {
    return "expired";
  }
  return "active";
}

export function canSendRecoveryEmail(
  cart: SavedCart,
  nowMs = Date.now(),
): boolean {
  if (effectiveCartStatus(cart, nowMs) !== "active") {
    return false;
  }
  if (!cart.email || cart.items.length === 0) {
    return false;
  }
  return cart.cartRecoveryConsent;
}

export function toEmailItems(cart: SavedCart): AbandonedCartEmailItem[] {
  return cart.items.map((item) => ({
    productId: item.slug,
    name: item.name,
    option: item.size,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    imageUrl: item.imageUrl,
  }));
}

export function buildStatusPayload(
  cart: SavedCart,
  nowMs = Date.now(),
): AbandonedCartStatusPayload {
  const status = effectiveCartStatus(cart, nowMs);
  return {
    status,
    converted: status === "converted",
    expired: status === "expired",
    canEmail: canSendRecoveryEmail(cart, nowMs),
  };
}

export function buildEmailPayload(cart: SavedCart): AbandonedCartEmailPayload {
  return {
    cartId: cart.publicId,
    email: cart.email ?? "",
    firstName: cart.firstName ?? "",
    currency: cart.currency,
    subtotal: cart.subtotal,
    items: toEmailItems(cart),
    restoreUrl: restoreCartUrl(cart.restoreToken),
    converted: cart.status === "converted",
    canEmail: canSendRecoveryEmail(cart),
  };
}

export function buildCheckoutIdentifiedPayload(
  cart: SavedCart,
): CheckoutIdentifiedWebhookPayload {
  return {
    event: "checkout_identified",
    cartId: cart.publicId,
    email: cart.email ?? "",
    firstName: cart.firstName ?? "",
    currency: cart.currency,
    subtotal: cart.subtotal,
    items: toEmailItems(cart),
    restoreUrl: restoreCartUrl(cart.restoreToken),
    statusCheckUrl: abandonedCartStatusUrl(cart.publicId),
    cartDataUrl: abandonedCartDataUrl(cart.publicId),
    idempotencyKey: identifiedIdempotencyKey(cart.publicId),
    canEmail: canSendRecoveryEmail(cart),
  };
}

export function buildCartConvertedPayload(
  cart: SavedCart,
): CartConvertedWebhookPayload {
  return {
    event: "cart_converted",
    cartId: cart.publicId,
    orderId: cart.orderId ?? "",
    idempotencyKey: convertedIdempotencyKey(cart.publicId),
  };
}
