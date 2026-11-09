import { getProductBySlug, getVariant, productDisplayName } from "@/data/products";
import type { OrderItem } from "@/lib/payments/types";
import { applyBogoToItems, isBogoEnabled } from "./bogo";
import { orderTotals } from "./pricing";

export type CartItemInput = {
  slug: string;
  size: string;
  qty: number;
};

export type OrderBuildOptions = {
  /** Override the BOGO_ENABLED env flag (tests). */
  bogoEnabled?: boolean;
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
// prices are never trusted. BOGO free units are attached here — they do not
// change the charged subtotal.
export function buildOrder(
  input: unknown,
  options: OrderBuildOptions = {},
): OrderBuildResult {
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
        error: `Unknown size ${raw.size} for ${productDisplayName(product)}.`,
      };
    }
    items.push({
      sku: variant.sku,
      name: productDisplayName(product),
      size: variant.size,
      qty,
      unitPrice: variant.price,
    });
  }

  const bogoEnabled = options.bogoEnabled ?? isBogoEnabled();
  const priced = applyBogoToItems(items, bogoEnabled);

  const subtotal = priced.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0,
  );
  const { shipping, total } = orderTotals(subtotal);
  return { ok: true, items: priced, subtotal, shipping, total };
}
