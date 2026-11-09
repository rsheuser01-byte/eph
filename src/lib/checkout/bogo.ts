import type { OrderItem } from "@/lib/payments/types";

/** Customer-facing name for the site-wide promotion. */
export const BOGO_LABEL = "Buy One Get One Free";

export const BOGO_BANNER_TEXT =
  "Buy One Get One Free on everything, every item you buy comes with a second one free.";

export const BOGO_PRODUCT_LINE =
  "Buy One Get One Free — every item you buy comes with a second one free.";

const DISABLED_VALUES = new Set(["0", "false", "off", "no"]);

/**
 * BOGO is on unless BOGO_ENABLED is an explicit off value.
 * Unset / empty defaults to ON.
 */
export function parseBogoEnabledFlag(raw: string | undefined): boolean {
  if (raw === undefined || raw.trim() === "") {
    return true;
  }
  return !DISABLED_VALUES.has(raw.trim().toLowerCase());
}

export function isBogoEnabled(
  raw: string | undefined = process.env.BOGO_ENABLED,
): boolean {
  return parseBogoEnabledFlag(raw);
}

/** One free unit of the same SKU for every paid unit. */
export function bogoFreeQty(
  paidQty: number,
  enabled = isBogoEnabled(),
): number {
  if (!enabled) {
    return 0;
  }
  if (!Number.isFinite(paidQty) || paidQty <= 0) {
    return 0;
  }
  return Math.floor(paidQty);
}

export function bogoShipQty(
  paidQty: number,
  enabled = isBogoEnabled(),
): number {
  const paid = Math.max(0, Math.floor(paidQty));
  return paid + bogoFreeQty(paid, enabled);
}

export function orderItemFreeQty(item: Pick<OrderItem, "freeQty">): number {
  const free = item.freeQty ?? 0;
  if (!Number.isFinite(free) || free <= 0) {
    return 0;
  }
  return Math.floor(free);
}

export function orderItemShipQty(item: Pick<OrderItem, "qty" | "freeQty">): number {
  return item.qty + orderItemFreeQty(item);
}

/**
 * Max paid units that can be sold from on-hand stock when each paid unit
 * also ships a free unit. Inventory-not-configured (null) is unlimited.
 */
export function paidQtyCapacity(
  available: number | null | undefined,
  enabled = isBogoEnabled(),
): number | null {
  if (available === null || available === undefined) {
    return null;
  }
  const stock = Math.max(0, Math.floor(available));
  if (!enabled) {
    return stock;
  }
  return Math.floor(stock / 2);
}

export function applyBogoToItems(
  items: OrderItem[],
  enabled = isBogoEnabled(),
): OrderItem[] {
  return items.map((item) => ({
    ...item,
    freeQty: bogoFreeQty(item.qty, enabled),
  }));
}

export function formatPaidFreeQty(
  paidQty: number,
  freeQty = 0,
): string {
  if (freeQty > 0) {
    return `${paidQty} + ${freeQty} free`;
  }
  return String(paidQty);
}

export function bogoInsufficientStockMessage(sku?: string): string {
  const target = sku ? ` for ${sku}` : "";
  return `Not enough stock${target} for ${BOGO_LABEL}. Each item you buy needs a second free unit of the same size in stock.`;
}
