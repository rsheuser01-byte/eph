import type { BillingInfo, OrderItem } from "@/lib/payments/types";

export type PaymentStatus =
  | "pending"
  | "approved"
  | "declined"
  | "refunded"
  | "partially_refunded"
  | "cancelled"
  | "review_required";

export type FulfillmentStatus = "unfulfilled" | "fulfilled" | "cancelled";

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
  total: number;
  currency: string;
  customer: BillingInfo;
  refundedAmount: number;
};

export type OrderStatusUpdate = {
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  transactionId?: string;
  refundedAmount?: number;
};

export interface OrderStore {
  readonly name: string;
  save(record: OrderRecord): Promise<void>;
  list(): Promise<OrderRecord[]>;
  get(orderId: string): Promise<OrderRecord | null>;
  updateStatus?(orderId: string, patch: OrderStatusUpdate): Promise<OrderRecord | null>;
}

export function approvedOrderDefaults(
  partial: Omit<
    OrderRecord,
    "paymentStatus" | "fulfillmentStatus" | "refundedAmount" | "status"
  > & {
    paymentStatus?: PaymentStatus;
    fulfillmentStatus?: FulfillmentStatus;
    refundedAmount?: number;
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
  };
}
