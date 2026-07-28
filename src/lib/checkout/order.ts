import { getProductBySlug, getVariant } from "@/data/products";
import type { OrderItem } from "@/lib/payments/types";
import { orderTotals } from "./pricing";

export type CartItemInput = {
  slug: string;
  size: string;
  qty: number;
};

export type OrderBuildResult =
  | {
      ok: true;
      items: OrderItem[];
      subtotal: number;
      shipping: number;
      /** Pre-tax merchandise + shipping (tax quoted separately). */
      total: number;
    }
  | { ok: false; error: string };

function isCartItem(value: unknown): value is CartItemInput {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.slug === "string" &&
    typeof record.size === "string" &&
    typeof record.qty === "number"
  );
}

// Recomputes the order entirely from server-side catalog data. Client-supplied
// prices are never trusted.
export function buildOrder(input: unknown): OrderBuildResult {
  if (!Array.isArray(input) || input.length === 0) {
    return { ok: false, error: "Cart is empty." };
  }

  const items: OrderItem[] = [];
  for (const raw of input) {
    if (!isCartItem(raw)) {
      return { ok: false, error: "Invalid cart item." };
    }
    const qty = Math.floor(raw.qty);
    if (qty < 1 || qty > 99) {
      return { ok: false, error: `Invalid quantity for ${raw.slug}.` };
    }
    const product = getProductBySlug(raw.slug);
    if (!product) {
      return { ok: false, error: `Unknown product: ${raw.slug}.` };
    }
    const variant = getVariant(product, raw.size);
    if (!variant) {
      return {
        ok: false,
        error: `Unknown size ${raw.size} for ${product.name}.`,
      };
    }
    items.push({
      sku: variant.sku,
      name: product.name,
      size: variant.size,
      qty,
      unitPrice: variant.price,
    });
  }

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0,
  );
  const { shipping, total } = orderTotals(subtotal);
  return { ok: true, items, subtotal, shipping, total };
}
