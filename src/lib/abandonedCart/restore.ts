import { getProductBySlug, getVariant } from "@/data/products";
import type { CartLineInput, SavedCartItem } from "./types";

/**
 * Rebuild shoppable cart lines from a saved cart using CURRENT catalog
 * prices and availability. Unavailable products are dropped.
 */
export function restoreCartLines(items: SavedCartItem[]): {
  lines: CartLineInput[];
  droppedCount: number;
} {
  const lines: CartLineInput[] = [];
  let droppedCount = 0;
  for (const item of items) {
    const product = getProductBySlug(item.slug);
    const variant = product ? getVariant(product, item.size) : undefined;
    if (!product || !variant) {
      droppedCount += 1;
      continue;
    }
    const qty = Math.floor(item.quantity);
    if (!Number.isFinite(qty) || qty < 1) {
      droppedCount += 1;
      continue;
    }
    lines.push({
      slug: product.slug,
      size: variant.size,
      qty,
    });
  }
  return { lines, droppedCount };
}
