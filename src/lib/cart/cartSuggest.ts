import type { ProductVariant } from "@/data/products";
import type { ResolvedCartLine } from "./types";

export const BAC_SLUG = "bac";

/**
 * Show a single BAC Water nudge when the cart has peptides/blends
 * and BAC is not already included.
 */
export function shouldSuggestBac(resolved: ResolvedCartLine[]): boolean {
  if (resolved.length === 0) {
    return false;
  }
  if (resolved.some((item) => item.product.slug === BAC_SLUG)) {
    return false;
  }
  return resolved.some(
    (item) =>
      item.product.category === "Peptide" ||
      item.product.category === "Blend" ||
      item.product.category === "Coenzyme",
  );
}

/**
 * True when every variant has a known qty of 0.
 * Missing keys / null qty mean inventory unknown or off → not fully OOS.
 */
export function allVariantsOutOfStock(
  variants: readonly ProductVariant[],
  availability: Record<string, number | null>,
): boolean {
  if (variants.length === 0) {
    return true;
  }
  return variants.every((variant) => {
    if (!Object.prototype.hasOwnProperty.call(availability, variant.sku)) {
      return false;
    }
    const qty = availability[variant.sku];
    return qty !== null && qty !== undefined && qty <= 0;
  });
}
