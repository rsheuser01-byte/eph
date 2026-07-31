import type { Product } from "@/data/products";

/**
 * Visible revision dates (Phase 3 #7).
 * Bump a value only when that page's substantive content actually changes —
 * never stamp "today" on every deploy.
 */
export const legalPagesUpdatedOn = {
  privacy: "2026-07-31",
  terms: "2026-07-31",
  refunds: "2026-07-31",
} as const;

export type LegalPageKey = keyof typeof legalPagesUpdatedOn;

/**
 * Fallback when a product has no per-SKU override.
 * Bump individual slugs in `productContentUpdatedOnBySlug` when specs or
 * research-context copy for that SKU changes.
 */
export const DEFAULT_PRODUCT_CONTENT_UPDATED_ON = "2026-07-31";

export const productContentUpdatedOnBySlug: Partial<
  Record<string, string>
> = {
  // Example: "glp-3": "2026-08-15",
};

export function productContentUpdatedOn(
  product: Pick<Product, "slug">,
): string {
  return (
    productContentUpdatedOnBySlug[product.slug] ??
    DEFAULT_PRODUCT_CONTENT_UPDATED_ON
  );
}
