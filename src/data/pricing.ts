import pricingGuide from "./pricing-guide.json";

export type PricingGuideEntry = {
  compound: string;
  size: string;
  listPrice: number;
  /** Catalog product slug when this SKU is live; null = priced but not listed yet. */
  productSlug: string | null;
};

export const pricingGuideEntries = pricingGuide as PricingGuideEntry[];

/** Recommended list price for a catalog product size (from pricing-guide.json). */
export function listPrice(productSlug: string, size: string): number {
  const entry = pricingGuideEntries.find(
    (row) => row.productSlug === productSlug && row.size === size,
  );
  if (!entry) {
    throw new Error(
      `No list price in pricing-guide.json for ${productSlug} ${size}`,
    );
  }
  return entry.listPrice;
}

/** Guide rows that are not yet linked to a live catalog product. */
export function unlistedPricingEntries(): PricingGuideEntry[] {
  return pricingGuideEntries.filter((row) => row.productSlug === null);
}
