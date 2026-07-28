import type { OrderItem } from "@/lib/payments/types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { products } from "@/data/products";

export type StockItem = { sku: string; qty: number };

export type StockMovementReason =
  | "sale"
  | "refund_restock"
  | "manual_adjust"
  | "receive"
  | "release";

export type InventoryRow = {
  sku: string;
  quantityOnHand: number;
  updatedAt: string;
};

export type StockMovement = {
  id: string;
  sku: string;
  delta: number;
  reason: StockMovementReason;
  orderId?: string;
  actor?: string;
  createdAt: string;
};

export function isInventoryEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function stockItemsFromOrder(items: OrderItem[]): StockItem[] {
  return items.map((item) => ({ sku: item.sku, qty: item.qty }));
}

export function catalogSkus(): string[] {
  return products.flatMap((product) =>
    product.variants.map((variant) => variant.sku),
  );
}

function friendlyStockError(message: string): string {
  const match = message.match(/insufficient stock for sku\s+(\S+)/i);
  if (match?.[1]) {
    return `Insufficient stock for ${match[1]}.`;
  }
  if (/would go negative/i.test(message)) {
    return "That adjustment would make stock negative.";
  }
  return message;
}

export async function getStockBySku(sku: string): Promise<number | null> {
  if (!isInventoryEnabled()) {
    return null;
  }
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from("inventory")
    .select("quantity_on_hand")
    .eq("sku", sku)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return 0;
  }
  return Number(data.quantity_on_hand);
}

export async function listInventory(): Promise<InventoryRow[]> {
  if (!isInventoryEnabled()) {
    return [];
  }
  const client = getSupabaseAdmin();
  const { data, error } = await client
    .from("inventory")
    .select("sku, quantity_on_hand, updated_at")
    .order("sku", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    sku: String(row.sku),
    quantityOnHand: Number(row.quantity_on_hand),
    updatedAt: String(row.updated_at),
  }));
}

export async function listMovements(
  sku?: string,
  limit = 50,
): Promise<StockMovement[]> {
  if (!isInventoryEnabled()) {
    return [];
  }
  const client = getSupabaseAdmin();
  let query = client
    .from("stock_movements")
    .select("id, sku, delta, reason, order_id, actor, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (sku) {
    query = query.eq("sku", sku);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    sku: String(row.sku),
    delta: Number(row.delta),
    reason: row.reason as StockMovementReason,
    orderId: row.order_id ? String(row.order_id) : undefined,
    actor: row.actor ? String(row.actor) : undefined,
    createdAt: String(row.created_at),
  }));
}

export async function reserveStock(
  items: StockItem[],
  orderId?: string,
  actor = "checkout",
): Promise<void> {
  if (!isInventoryEnabled()) {
    return;
  }
  const client = getSupabaseAdmin();
  const { error } = await client.rpc("reserve_stock", {
    items,
    p_order_id: orderId ?? null,
    p_actor: actor,
  });
  if (error) {
    throw new Error(friendlyStockError(error.message));
  }
}

export async function releaseStock(
  items: StockItem[],
  orderId?: string,
  actor = "checkout",
): Promise<void> {
  if (!isInventoryEnabled()) {
    return;
  }
  const client = getSupabaseAdmin();
  const { error } = await client.rpc("release_stock", {
    items,
    p_order_id: orderId ?? null,
    p_actor: actor,
  });
  if (error) {
    throw new Error(friendlyStockError(error.message));
  }
}

export async function adjustStock(
  sku: string,
  delta: number,
  reason: StockMovementReason,
  options: { orderId?: string; actor?: string } = {},
): Promise<number> {
  if (!isInventoryEnabled()) {
    throw new Error("Inventory requires Supabase configuration.");
  }
  const client = getSupabaseAdmin();
  const { data, error } = await client.rpc("adjust_stock", {
    p_sku: sku,
    p_delta: delta,
    p_reason: reason,
    p_order_id: options.orderId ?? null,
    p_actor: options.actor ?? "admin",
  });
  if (error) {
    throw new Error(friendlyStockError(error.message));
  }
  return Number(data);
}

/** Ensure every catalog SKU has an inventory row (default qty 0). */
export async function seedInventoryFromCatalog(
  defaultQty = 0,
): Promise<number> {
  if (!isInventoryEnabled()) {
    throw new Error("Inventory requires Supabase configuration.");
  }
  const client = getSupabaseAdmin();
  const rows = catalogSkus().map((sku) => ({
    sku,
    quantity_on_hand: defaultQty,
  }));
  const { error } = await client.from("inventory").upsert(rows, {
    onConflict: "sku",
    ignoreDuplicates: true,
  });
  if (error) {
    throw new Error(error.message);
  }
  return rows.length;
}
