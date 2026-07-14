import type { BillingInfo, OrderItem } from "@/lib/payments/types";

// Note: card data is NEVER stored. Only order/customer details are persisted.
export type OrderRecord = {
  orderId: string;
  createdAt: string;
  provider: string;
  transactionId?: string;
  status: "approved";
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  customer: BillingInfo;
};

export interface OrderStore {
  readonly name: string;
  save(record: OrderRecord): Promise<void>;
  list(): Promise<OrderRecord[]>;
  get(orderId: string): Promise<OrderRecord | null>;
}
