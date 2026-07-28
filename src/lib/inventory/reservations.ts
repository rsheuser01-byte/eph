import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isInventoryEnabled, type StockItem } from "./index";
import { assertInventoryConfigured } from "@/lib/config/productionReadiness";

export const DEFAULT_RESERVATION_MINUTES = 30;

export function reservationMinutes(): number {
  const raw = process.env.CHECKOUT_RESERVATION_MINUTES?.trim();
  if (!raw) {
    return DEFAULT_RESERVATION_MINUTES;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_RESERVATION_MINUTES;
  }
  return Math.floor(parsed);
}

export function reservationExpiresAt(
  now = new Date(),
  minutes = reservationMinutes(),
): Date {
  return new Date(now.getTime() + minutes * 60_000);
}

function friendlyReservationError(message: string): string {
  const match = message.match(/insufficient stock for sku\s+(\S+)/i);
  if (match?.[1]) {
    return `Insufficient stock for ${match[1]}.`;
  }
  return message;
}

/**
 * Create active reservations for an order without decrementing on-hand stock.
 * Order row must already exist when using Supabase (FK).
 */
export async function createReservations(
  items: StockItem[],
  orderId: string,
  expiresAt: Date,
  actor = "checkout",
): Promise<void> {
  assertInventoryConfigured();
  if (!isInventoryEnabled()) {
    return;
  }
  const client = getSupabaseAdmin();
  const { error } = await client.rpc("create_inventory_reservations", {
    items,
    p_order_id: orderId,
    p_expires_at: expiresAt.toISOString(),
    p_actor: actor,
  });
  if (error) {
    throw new Error(friendlyReservationError(error.message));
  }
}

/** Decrement on-hand and mark reservations committed. Idempotent. */
export async function commitReservations(
  orderId: string,
  actor = "checkout",
): Promise<void> {
  assertInventoryConfigured();
  if (!isInventoryEnabled()) {
    return;
  }
  const client = getSupabaseAdmin();
  const { error } = await client.rpc("commit_inventory_reservations", {
    p_order_id: orderId,
    p_actor: actor,
  });
  if (error) {
    throw new Error(friendlyReservationError(error.message));
  }
}

/** Release active reservations (decline/cancel). Idempotent. */
export async function releaseReservations(
  orderId: string,
  actor = "checkout",
): Promise<void> {
  assertInventoryConfigured();
  if (!isInventoryEnabled()) {
    return;
  }
  const client = getSupabaseAdmin();
  const { error } = await client.rpc("release_inventory_reservations", {
    p_order_id: orderId,
    p_actor: actor,
  });
  if (error) {
    throw new Error(friendlyReservationError(error.message));
  }
}

/** Mark active reservations expired. Idempotent. */
export async function expireReservations(
  orderId: string,
  actor = "cron",
): Promise<void> {
  assertInventoryConfigured();
  if (!isInventoryEnabled()) {
    return;
  }
  const client = getSupabaseAdmin();
  const { error } = await client.rpc("expire_inventory_reservations", {
    p_order_id: orderId,
    p_actor: actor,
  });
  if (error) {
    throw new Error(friendlyReservationError(error.message));
  }
}

/** Order ids with active reservations past expires_at. */
export async function listExpiredReservationOrderIds(
  limit = 50,
): Promise<string[]> {
  if (!isInventoryEnabled()) {
    return [];
  }
  const client = getSupabaseAdmin();
  const { data, error } = await client.rpc("list_expired_reservation_orders", {
    p_limit: limit,
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((row) => {
    if (typeof row === "string") {
      return row;
    }
    if (row && typeof row === "object" && "order_id" in row) {
      return String((row as { order_id: string }).order_id);
    }
    return String(row);
  });
}
