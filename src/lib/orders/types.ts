import type { BillingInfo, OrderItem } from "@/lib/payments/types";

export type PaymentStatus =
  | "pending"
  | "approved"
  | "declined"
  | "refunded"
  | "partially_refunded"
  | "cancelled"
  | "review_required"
  | "expired";

export type FulfillmentStatus =
  | "unfulfilled"
  | "processing"
  | "shipped"
  | "fulfilled"
  | "cancelled";

// Note: card data is NEVER stored. Only order/customer details are persisted.
export type OrderRecord = {
  orderId: string;
  createdAt: string;
  provider: string;
  transactionId?: string;
  /** @deprecated Prefer paymentStatus. Kept for file-store / email compatibility. */
  status: "approved" | PaymentStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  /** Sales tax collected at checkout (server-quoted). */
  tax: number;
  /** Merchandise discount from an applied promo code. */
  discount: number;
  /** Normalized promo code when a discount was applied. */
  promoCode?: string;
  total: number;
  currency: string;
  customer: BillingInfo;
  refundedAmount: number;
  /** When inventory reservation for this checkout expires. */
  reservationExpiresAt?: string;
  /** Opaque customer-facing token for status lookup (not a secret credential). */
  lookupToken?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippedAt?: string;
  fulfilledAt?: string;
  fulfillmentNotes?: string;
  taxProvider?: string;
  taxQuoteId?: string;
  taxJurisdiction?: string;
};

export type OrderStatusUpdate = {
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  transactionId?: string;
  refundedAmount?: number;
  reservationExpiresAt?: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  shippedAt?: string | null;
  fulfilledAt?: string | null;
  fulfillmentNotes?: string | null;
};

export interface OrderStore {
  readonly name: string;
  save(record: OrderRecord): Promise<void>;
  list(): Promise<OrderRecord[]>;
  get(orderId: string): Promise<OrderRecord | null>;
  updateStatus?(orderId: string, patch: OrderStatusUpdate): Promise<OrderRecord | null>;
  /** Used for first-order promo eligibility. */
  hasApprovedOrderForEmail?(email: string): Promise<boolean>;
}

export function approvedOrderDefaults(
  partial: Omit<
    OrderRecord,
    | "paymentStatus"
    | "fulfillmentStatus"
    | "refundedAmount"
    | "status"
    | "tax"
    | "discount"
  > & {
    paymentStatus?: PaymentStatus;
    fulfillmentStatus?: FulfillmentStatus;
    refundedAmount?: number;
    tax?: number;
    discount?: number;
    status?: OrderRecord["status"];
  },
): OrderRecord {
  const paymentStatus = partial.paymentStatus ?? "approved";
  return {
    ...partial,
    status: partial.status ?? paymentStatus,
    paymentStatus,
    fulfillmentStatus: partial.fulfillmentStatus ?? "unfulfilled",
    refundedAmount: partial.refundedAmount ?? 0,
    tax: partial.tax ?? 0,
    discount: partial.discount ?? 0,
  };
}
