import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingInfo, OrderItem } from "@/lib/payments/types";
import type {
  FulfillmentStatus,
  OrderRecord,
  OrderStatusUpdate,
  OrderStore,
  PaymentStatus,
} from "./types";

type OrderRow = {
  id: string;
  created_at: string;
  provider: string;
  transaction_id: string | null;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  subtotal: number | string;
  shipping: number | string;
  total: number | string;
  currency: string;
  customer: BillingInfo;
  refunded_amount: number | string;
  reservation_expires_at: string | null;
  lookup_token: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  fulfilled_at: string | null;
  fulfillment_notes: string | null;
};

type OrderItemRow = {
  order_id: string;
  sku: string;
  name: string;
  size: string;
  qty: number;
  unit_price: number | string;
};

function asNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function mapRow(row: OrderRow, items: OrderItem[]): OrderRecord {
  return {
    orderId: row.id,
    createdAt: row.created_at,
    provider: row.provider,
    transactionId: row.transaction_id ?? undefined,
    status: row.payment_status,
    paymentStatus: row.payment_status,
    fulfillmentStatus: row.fulfillment_status,
    items,
    subtotal: asNumber(row.subtotal),
    shipping: asNumber(row.shipping),
    total: asNumber(row.total),
    currency: row.currency,
    customer: row.customer,
    refundedAmount: asNumber(row.refunded_amount),
    reservationExpiresAt: row.reservation_expires_at ?? undefined,
    lookupToken: row.lookup_token ?? undefined,
    carrier: row.carrier ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
    trackingUrl: row.tracking_url ?? undefined,
    shippedAt: row.shipped_at ?? undefined,
    fulfilledAt: row.fulfilled_at ?? undefined,
    fulfillmentNotes: row.fulfillment_notes ?? undefined,
  };
}

function mapItems(rows: OrderItemRow[]): OrderItem[] {
  return rows.map((row) => ({
    sku: row.sku,
    name: row.name,
    size: row.size,
    qty: row.qty,
    unitPrice: asNumber(row.unit_price),
  }));
}

export function createSupabaseOrderStore(
  client: SupabaseClient,
): OrderStore {
  return {
    name: "supabase",

    async save(record: OrderRecord): Promise<void> {
      const { error: orderError } = await client.from("orders").upsert(
        {
          id: record.orderId,
          created_at: record.createdAt,
          provider: record.provider,
          transaction_id: record.transactionId ?? null,
          payment_status: record.paymentStatus,
          fulfillment_status: record.fulfillmentStatus,
          subtotal: record.subtotal,
          shipping: record.shipping,
          total: record.total,
          currency: record.currency,
          customer: record.customer,
          refunded_amount: record.refundedAmount,
          reservation_expires_at: record.reservationExpiresAt ?? null,
          lookup_token: record.lookupToken ?? null,
          carrier: record.carrier ?? null,
          tracking_number: record.trackingNumber ?? null,
          tracking_url: record.trackingUrl ?? null,
          shipped_at: record.shippedAt ?? null,
          fulfilled_at: record.fulfilledAt ?? null,
          fulfillment_notes: record.fulfillmentNotes ?? null,
        },
        { onConflict: "id" },
      );

      if (orderError) {
        throw new Error(`Failed to save order: ${orderError.message}`);
      }

      const { error: deleteError } = await client
        .from("order_items")
        .delete()
        .eq("order_id", record.orderId);
      if (deleteError) {
        throw new Error(`Failed to replace order items: ${deleteError.message}`);
      }

      if (record.items.length === 0) {
        return;
      }

      const { error: itemsError } = await client.from("order_items").insert(
        record.items.map((item) => ({
          order_id: record.orderId,
          sku: item.sku,
          name: item.name,
          size: item.size,
          qty: item.qty,
          unit_price: item.unitPrice,
        })),
      );

      if (itemsError) {
        throw new Error(`Failed to save order items: ${itemsError.message}`);
      }
    },

    async list(): Promise<OrderRecord[]> {
      const { data: orders, error } = await client
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`Failed to list orders: ${error.message}`);
      }

      const rows = (orders ?? []) as OrderRow[];
      if (rows.length === 0) {
        return [];
      }

      const ids = rows.map((row) => row.id);
      const { data: items, error: itemsError } = await client
        .from("order_items")
        .select("*")
        .in("order_id", ids);

      if (itemsError) {
        throw new Error(`Failed to list order items: ${itemsError.message}`);
      }

      const byOrder = new Map<string, OrderItem[]>();
      for (const item of (items ?? []) as OrderItemRow[]) {
        const list = byOrder.get(item.order_id) ?? [];
        list.push(...mapItems([item]));
        byOrder.set(item.order_id, list);
      }

      return rows.map((row) => mapRow(row, byOrder.get(row.id) ?? []));
    },

    async get(orderId: string): Promise<OrderRecord | null> {
      const { data: order, error } = await client
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to get order: ${error.message}`);
      }
      if (!order) {
        return null;
      }

      const { data: items, error: itemsError } = await client
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (itemsError) {
        throw new Error(`Failed to get order items: ${itemsError.message}`);
      }

      return mapRow(order as OrderRow, mapItems((items ?? []) as OrderItemRow[]));
    },

    async updateStatus(
      orderId: string,
      patch: OrderStatusUpdate,
    ): Promise<OrderRecord | null> {
      const updates: Record<string, unknown> = {};
      if (patch.paymentStatus !== undefined) {
        updates.payment_status = patch.paymentStatus;
      }
      if (patch.fulfillmentStatus !== undefined) {
        updates.fulfillment_status = patch.fulfillmentStatus;
      }
      if (patch.transactionId !== undefined) {
        updates.transaction_id = patch.transactionId;
      }
      if (patch.refundedAmount !== undefined) {
        updates.refunded_amount = patch.refundedAmount;
      }
      if (patch.reservationExpiresAt !== undefined) {
        updates.reservation_expires_at = patch.reservationExpiresAt;
      }
      if (patch.carrier !== undefined) {
        updates.carrier = patch.carrier;
      }
      if (patch.trackingNumber !== undefined) {
        updates.tracking_number = patch.trackingNumber;
      }
      if (patch.trackingUrl !== undefined) {
        updates.tracking_url = patch.trackingUrl;
      }
      if (patch.shippedAt !== undefined) {
        updates.shipped_at = patch.shippedAt;
      }
      if (patch.fulfilledAt !== undefined) {
        updates.fulfilled_at = patch.fulfilledAt;
      }
      if (patch.fulfillmentNotes !== undefined) {
        updates.fulfillment_notes = patch.fulfillmentNotes;
      }

      if (Object.keys(updates).length === 0) {
        return this.get(orderId);
      }

      const { error } = await client
        .from("orders")
        .update(updates)
        .eq("id", orderId);

      if (error) {
        throw new Error(`Failed to update order: ${error.message}`);
      }

      return this.get(orderId);
    },
  };
}
