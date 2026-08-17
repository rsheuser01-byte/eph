import { getOrderStore } from "@/lib/orders";
import { SAVED_CART_TTL_MS } from "./constants";
import { cartCurrency, snapshotCartItems } from "./snapshot";
import { restoreCartLines } from "./restore";
import { getSavedCartStore } from "./store";
import { newSavedCartId } from "./fileStore";
import {
  generatePublicId,
  generateRestoreToken,
  generateSessionToken,
  hashToken,
} from "./token";
import {
  buildCartConvertedPayload,
  buildCheckoutIdentifiedPayload,
  buildEmailPayload,
  buildStatusPayload,
  effectiveCartStatus,
} from "./payload";
import { sendAbandonedCartWebhookSafe } from "./webhook";
import type {
  AbandonedCartEmailPayload,
  AbandonedCartStatusPayload,
  CartLineInput,
  RestoreResult,
  SavedCart,
  SavedCartStore,
} from "./types";

export type AbandonedCartServiceDeps = {
  store?: SavedCartStore;
  sendWebhook?: (payload: Record<string, unknown>) => Promise<void>;
  nowMs?: number;
};

export type UpsertSavedCartResult = {
  cart: SavedCart;
  sessionToken: string;
  webhookSent: boolean;
};

function nowIso(nowMs: number): string {
  return new Date(nowMs).toISOString();
}

function expiresAtIso(nowMs: number): string {
  return new Date(nowMs + SAVED_CART_TTL_MS).toISOString();
}

function resolveDeps(deps: AbandonedCartServiceDeps = {}): {
  store: SavedCartStore;
  sendWebhook: (payload: Record<string, unknown>) => Promise<void>;
  nowMs: number;
} {
  return {
    store: deps.store ?? getSavedCartStore(),
    sendWebhook: deps.sendWebhook ?? sendAbandonedCartWebhookSafe,
    nowMs: deps.nowMs ?? Date.now(),
  };
}

function createCart(sessionToken: string, nowMs: number): SavedCart {
  const at = nowIso(nowMs);
  return {
    id: newSavedCartId(),
    publicId: generatePublicId(),
    sessionIdHash: hashToken(sessionToken),
    restoreToken: generateRestoreToken(),
    email: null,
    firstName: null,
    items: [],
    subtotal: 0,
    currency: cartCurrency(),
    status: "active",
    createdAt: at,
    updatedAt: at,
    identifiedAt: null,
    checkoutStartedAt: null,
    convertedAt: null,
    orderId: null,
    lastRecoveryEventAt: null,
    identifiedEventSentAt: null,
    convertedEventSentAt: null,
    expiresAt: expiresAtIso(nowMs),
    cartRecoveryConsent: true,
  };
}

async function maybeSendIdentified(
  cart: SavedCart,
  store: SavedCartStore,
  sendWebhook: (payload: Record<string, unknown>) => Promise<void>,
  nowMs: number,
): Promise<boolean> {
  if (effectiveCartStatus(cart, nowMs) !== "active") {
    return false;
  }
  if (!cart.email || cart.items.length === 0) {
    return false;
  }
  const at = nowIso(nowMs);
  const claimed = await store.claimIdentifiedEvent(cart.id, at);
  if (!claimed) {
    return false;
  }
  const latest = (await store.getById(cart.id)) ?? {
    ...cart,
    identifiedEventSentAt: at,
    lastRecoveryEventAt: at,
  };
  void sendWebhook(
    buildCheckoutIdentifiedPayload(latest) as unknown as Record<string, unknown>,
  ).catch(() => undefined);
  return true;
}

/**
 * Create or update the server-side saved cart for this browser session.
 * Never throws to callers that wrap it — still throw on programming errors
 * in tests; API routes catch.
 */
export async function upsertSavedCart(
  sessionToken: string | undefined,
  lines: CartLineInput[],
  deps: AbandonedCartServiceDeps = {},
): Promise<UpsertSavedCartResult> {
  const { store, sendWebhook, nowMs } = resolveDeps(deps);
  const token = sessionToken?.trim() || generateSessionToken();
  const { items, subtotal } = snapshotCartItems(lines);

  let cart = await store.getBySessionHash(hashToken(token));
  if (!cart) {
    cart = createCart(token, nowMs);
  } else if (cart.status === "converted") {
    cart = createCart(token, nowMs);
  } else if (effectiveCartStatus(cart, nowMs) === "expired") {
    cart = { ...cart, status: "expired", updatedAt: nowIso(nowMs) };
    await store.save(cart);
    cart = createCart(token, nowMs);
  }

  cart = {
    ...cart,
    items,
    subtotal,
    updatedAt: nowIso(nowMs),
    expiresAt: expiresAtIso(nowMs),
  };
  await store.save(cart);
  const webhookSent = await maybeSendIdentified(
    cart,
    store,
    sendWebhook,
    nowMs,
  );
  return { cart, sessionToken: token, webhookSent };
}

export async function identifySavedCart(
  sessionToken: string | undefined,
  email: string,
  firstName: string,
  lines: CartLineInput[],
  deps: AbandonedCartServiceDeps = {},
): Promise<UpsertSavedCartResult> {
  const { store, sendWebhook, nowMs } = resolveDeps(deps);
  const upserted = await upsertSavedCart(sessionToken, lines, {
    store,
    sendWebhook,
    nowMs,
  });
  let cart = upserted.cart;
  if (cart.status !== "active") {
    return upserted;
  }

  const at = nowIso(nowMs);
  cart = {
    ...cart,
    email,
    firstName: firstName || cart.firstName,
    identifiedAt: cart.identifiedAt ?? at,
    cartRecoveryConsent: true,
    updatedAt: at,
    expiresAt: expiresAtIso(nowMs),
  };
  await store.save(cart);
  const webhookSent = await maybeSendIdentified(
    cart,
    store,
    sendWebhook,
    nowMs,
  );
  return { cart, sessionToken: upserted.sessionToken, webhookSent };
}

export async function linkSavedCartToCheckout(
  input: {
    sessionToken?: string;
    email: string;
    firstName: string;
    lines: CartLineInput[];
    orderId: string;
  },
  deps: AbandonedCartServiceDeps = {},
): Promise<UpsertSavedCartResult | null> {
  const { store, sendWebhook, nowMs } = resolveDeps(deps);
  const identified = await identifySavedCart(
    input.sessionToken,
    input.email,
    input.firstName,
    input.lines,
    { store, sendWebhook, nowMs },
  );
  let cart = identified.cart;
  if (cart.status !== "active") {
    return identified;
  }
  const at = nowIso(nowMs);
  cart = {
    ...cart,
    checkoutStartedAt: cart.checkoutStartedAt ?? at,
    orderId: input.orderId,
    updatedAt: at,
  };
  await store.save(cart);
  return { ...identified, cart };
}

export async function convertSavedCartForOrder(
  orderId: string,
  email?: string,
  deps: AbandonedCartServiceDeps = {},
): Promise<SavedCart | null> {
  const { store, sendWebhook, nowMs } = resolveDeps(deps);
  let cart = await store.getByOrderId(orderId);
  if (!cart && email) {
    cart = await store.findActiveByEmail(email);
  }
  if (!cart) {
    return null;
  }
  if (cart.status === "converted") {
    return cart;
  }

  const at = nowIso(nowMs);
  cart = {
    ...cart,
    status: "converted",
    convertedAt: at,
    orderId,
    updatedAt: at,
  };
  await store.save(cart);

  const claimed = await store.claimConvertedEvent(cart.id, at);
  if (claimed) {
    void sendWebhook(
      buildCartConvertedPayload(cart) as unknown as Record<string, unknown>,
    ).catch(() => undefined);
  }
  return cart;
}

export async function restoreSavedCart(
  token: string,
  deps: AbandonedCartServiceDeps = {},
): Promise<RestoreResult & { sessionToken?: string }> {
  const { store, nowMs } = resolveDeps(deps);
  const raw = token.trim();
  if (!raw) {
    return { ok: false, reason: "invalid" };
  }
  const cart = await store.getByRestoreToken(raw);
  if (!cart) {
    return { ok: false, reason: "invalid" };
  }
  const status = effectiveCartStatus(cart, nowMs);
  if (status === "expired") {
    return { ok: false, reason: "expired" };
  }
  if (status === "converted") {
    return { ok: false, reason: "converted" };
  }

  const { lines, droppedCount } = restoreCartLines(cart.items);
  const sessionToken = generateSessionToken();
  const rebound: SavedCart = {
    ...cart,
    sessionIdHash: hashToken(sessionToken),
    updatedAt: nowIso(nowMs),
    expiresAt: expiresAtIso(nowMs),
  };
  await store.save(rebound);
  return { ok: true, lines, droppedCount, sessionToken };
}

export async function getAbandonedCartStatus(
  publicId: string,
  deps: AbandonedCartServiceDeps = {},
): Promise<AbandonedCartStatusPayload | null> {
  const { store, nowMs } = resolveDeps(deps);
  const cart = await store.getByPublicId(publicId.trim());
  if (!cart) {
    return null;
  }
  return buildStatusPayload(cart, nowMs);
}

export async function getAbandonedCartEmailData(
  publicId: string,
  deps: AbandonedCartServiceDeps = {},
): Promise<AbandonedCartEmailPayload | null> {
  const { store } = resolveDeps(deps);
  const cart = await store.getByPublicId(publicId.trim());
  if (!cart) {
    return null;
  }
  return buildEmailPayload(cart);
}

/**
 * Paid-order hook. Never throws — recovery must not break checkout.
 */
export async function markSavedCartConvertedSafe(
  orderId: string,
  email?: string,
): Promise<void> {
  try {
    let resolvedEmail = email;
    if (!resolvedEmail) {
      try {
        const order = await getOrderStore().get(orderId);
        resolvedEmail = order?.customer.email;
      } catch {
        resolvedEmail = undefined;
      }
    }
    await convertSavedCartForOrder(orderId, resolvedEmail);
  } catch (error) {
    console.error("[abandoned-cart] convert failed", {
      orderId,
      error: error instanceof Error ? error.name : "unknown",
    });
  }
}
