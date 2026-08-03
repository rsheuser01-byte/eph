import type { ProductVariant } from "@/data/products";

/**
 * Pick the vial size to select by default on a product page.
 * Walks variants in catalog order and returns the first in-stock size.
 * Falls back to the first variant when all are out of stock (restock UX).
 *
 * Stock rule matches ProductPurchase / schema:
 * missing key, null, or undefined qty → treat as in stock; qty > 0 → in stock; 0 → OOS.
 */
export function defaultInStockSize(
  variants: readonly ProductVariant[],
  availability: Record<string, number | null>,
): string {
  if (variants.length === 0) {
    return "";
  }

  const inStock = variants.find((variant) =>
    isVariantInStock(variant.sku, availability),
  );

  return inStock?.size ?? variants[0]!.size;
}

/**
 * Keep the user's selection when it is still in stock; otherwise fall back
 * to the first in-stock size (handles availability updates after mount).
 */
export function resolveInStockSize(
  selected: string,
  variants: readonly ProductVariant[],
  availability: Record<string, number | null>,
): string {
  const selectedVariant = variants.find((variant) => variant.size === selected);
  if (
    selectedVariant &&
    isVariantInStock(selectedVariant.sku, availability)
  ) {
    return selected;
  }
  return defaultInStockSize(variants, availability);
}

export function isVariantInStock(
  sku: string,
  availability: Record<string, number | null>,
): boolean {
  if (!Object.prototype.hasOwnProperty.call(availability, sku)) {
    return true;
  }
  const qty = availability[sku];
  return qty === null || qty === undefined || qty > 0;
}
