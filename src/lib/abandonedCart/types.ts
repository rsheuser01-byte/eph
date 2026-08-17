export type SavedCartStatus = "active" | "converted" | "expired";

export type SavedCartItem = {
  slug: string;
  size: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl: string;
};

export type SavedCart = {
  id: string;
  publicId: string;
  sessionIdHash: string;
  restoreToken: string;
  email: string | null;
  firstName: string | null;
  items: SavedCartItem[];
  subtotal: number;
  currency: string;
  status: SavedCartStatus;
  createdAt: string;
  updatedAt: string;
  identifiedAt: string | null;
  checkoutStartedAt: string | null;
  convertedAt: string | null;
  orderId: string | null;
  lastRecoveryEventAt: string | null;
  identifiedEventSentAt: string | null;
  convertedEventSentAt: string | null;
  expiresAt: string;
  cartRecoveryConsent: boolean;
};

export type CartLineInput = {
  slug: string;
  size: string;
  qty: number;
};

export type SavedCartStore = {
  readonly name: string;
  save(cart: SavedCart): Promise<void>;
  getById(id: string): Promise<SavedCart | null>;
  getByPublicId(publicId: string): Promise<SavedCart | null>;
  getBySessionHash(hash: string): Promise<SavedCart | null>;
  getByRestoreToken(token: string): Promise<SavedCart | null>;
  getByOrderId(orderId: string): Promise<SavedCart | null>;
  findActiveByEmail(email: string): Promise<SavedCart | null>;
  listRecent(limit?: number): Promise<SavedCart[]>;
  /**
   * Atomically set identifiedEventSentAt when it is still null.
   * Returns true if this caller won the claim.
   */
  claimIdentifiedEvent(id: string, at: string): Promise<boolean>;
  /**
   * Atomically set convertedEventSentAt when it is still null.
   * Returns true if this caller won the claim.
   */
  claimConvertedEvent(id: string, at: string): Promise<boolean>;
};

export type AbandonedCartStatusPayload = {
  status: SavedCartStatus;
  converted: boolean;
  expired: boolean;
  canEmail: boolean;
};

export type AbandonedCartEmailItem = {
  productId: string;
  name: string;
  option: string;
  quantity: number;
  unitPrice: number;
  imageUrl: string;
};

export type AbandonedCartEmailPayload = {
  cartId: string;
  email: string;
  firstName: string;
  currency: string;
  subtotal: number;
  items: AbandonedCartEmailItem[];
  restoreUrl: string;
  converted: boolean;
  canEmail: boolean;
};

export type CheckoutIdentifiedWebhookPayload = {
  event: "checkout_identified";
  cartId: string;
  email: string;
  firstName: string;
  currency: string;
  subtotal: number;
  items: AbandonedCartEmailItem[];
  restoreUrl: string;
  statusCheckUrl: string;
  cartDataUrl: string;
  idempotencyKey: string;
  canEmail: boolean;
};

export type CartConvertedWebhookPayload = {
  event: "cart_converted";
  cartId: string;
  orderId: string;
  idempotencyKey: string;
};

export type RestoreResult =
  | {
      ok: true;
      lines: CartLineInput[];
      droppedCount: number;
    }
  | {
      ok: false;
      reason: "invalid" | "expired" | "converted";
    };
