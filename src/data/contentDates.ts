import type { Product } from "@/data/products";

/**
 * Visible revision dates (Phase 3 #7).
 * Bump a value only when that page's substantive content actually changes —
 * never stamp "today" on every deploy.
 */
export const legalPagesUpdatedOn = {
  privacy: "2026-08-19",
  terms: "2026-08-17",
  refunds: "2026-07-31",
} as const;

export type LegalPageKey = keyof typeof legalPagesUpdatedOn;

/**
 * Fallback when a product has no per-SKU override.
 * Bump individual slugs in `productContentUpdatedOnBySlug` when specs or
 * research-context copy for that SKU changes.
 */
export const DEFAULT_PRODUCT_CONTENT_UPDATED_ON = "2026-08-05";

export const productContentUpdatedOnBySlug: Partial<
  Record<string, string>
> = {
  "glp-3": "2026-08-20",
  "glp-2": "2026-08-20",
  "mt-2": "2026-08-20",
  "pt-141": "2026-08-20",
  "ss-31": "2026-08-20",
  "5-amino-1mq": "2026-08-21",
  semax: "2026-08-21",
};

export function productContentUpdatedOn(
  product: Pick<Product, "slug">,
): string {
  return (
    productContentUpdatedOnBySlug[product.slug] ??
    DEFAULT_PRODUCT_CONTENT_UPDATED_ON
  );
}
