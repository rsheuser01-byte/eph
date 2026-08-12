import type { ProductVariant } from "@/data/products";
import type { ResolvedCartLine } from "./types";

export const NAD_SLUG = "nad";

/** Preferred blend upsells when NAD+ is already in the cart. */
export const BLEND_SUGGEST_SLUGS = ["glow-blend", "klow-blend"] as const;

/** Never suggest diluents / removed supply SKUs beside peptide carts. */
const BLOCKED_SUGGEST_SLUGS = new Set(["bac"]);

const SUGGEST_REASONS: Record<string, string> = {
  nad: "Cellular cofactor for metabolic and redox assay panels",
  "glow-blend": "Multi-peptide blend for coordinated marker studies",
  "klow-blend": "Expanded multi-peptide blend including KPV",
};

/**
 * Cart upsell candidates in priority order.
 * Prefer NAD+; if NAD+ is already in the cart, offer GLOW then KLOW
 * when those blends are not already included.
 */
export function getCartSuggestCandidates(
  resolved: ResolvedCartLine[],
): string[] {
  if (resolved.length === 0) {
    return [];
  }
  const inCart = new Set(resolved.map((item) => item.product.slug));
  const candidates = !inCart.has(NAD_SLUG)
    ? [NAD_SLUG]
    : BLEND_SUGGEST_SLUGS.filter((slug) => !inCart.has(slug));
  return candidates.filter((slug) => !BLOCKED_SUGGEST_SLUGS.has(slug));
}

export function cartSuggestReason(slug: string): string {
  return SUGGEST_REASONS[slug] ?? "Also useful with items in your cart";
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
