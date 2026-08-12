import { getProductBySlug, type Product } from "@/data/products";

export type RelatedProductEntry = {
  slug: string;
  /** One-line research reason shown under the product name. */
  reason: string;
};

export type RelatedProduct = {
  product: Product;
  reason: string;
};

/**
 * Curated meaningful pairs — not category dumps.
 * Keep 2–4 entries per product; prefer near-analogs and related blends.
 */
export const RELATED_PRODUCT_MAP: Record<string, RelatedProductEntry[]> = {
  "glp-3": [
    { slug: "glp-2", reason: "Dual incretin peer for comparative assays" },
    { slug: "nad", reason: "Cellular metabolism companion for pathway panels" },
  ],
  "glp-2": [
    { slug: "glp-3", reason: "Triple agonist peer for comparative assays" },
    { slug: "nad", reason: "Cellular metabolism companion for pathway panels" },
  ],
  "mots-c": [
    { slug: "nad", reason: "Metabolic and redox pathway companion" },
    { slug: "tesamorelin", reason: "Peptide stock for adjacent endocrine models" },
  ],
  tesamorelin: [
    { slug: "mots-c", reason: "Metabolic peptide for adjacent pathway work" },
    { slug: "nad", reason: "Cellular energy companion for assay panels" },
  ],
  "mt-2": [
    { slug: "pt-141", reason: "Near-analog for melanocortin comparisons" },
    { slug: "nad", reason: "Cellular metabolism companion for assay panels" },
  ],
  "pt-141": [
    { slug: "mt-2", reason: "Near-analog for melanocortin comparisons" },
    { slug: "nad", reason: "Cellular metabolism companion for assay panels" },
  ],
  nad: [
    { slug: "mots-c", reason: "Mitochondrial peptide for metabolic panels" },
    { slug: "glp-3", reason: "Incretin research stock for broader pathway work" },
  ],
  "wolverine-blend": [
    { slug: "glow-blend", reason: "Related multi-peptide blend with GHK-Cu" },
    { slug: "klow-blend", reason: "Expanded blend including KPV" },
  ],
  "glow-blend": [
    { slug: "wolverine-blend", reason: "BPC-157 / TB-500 focused blend" },
    { slug: "klow-blend", reason: "Expanded blend including KPV" },
  ],
  "klow-blend": [
    { slug: "glow-blend", reason: "Related multi-peptide blend without KPV" },
    { slug: "wolverine-blend", reason: "BPC-157 / TB-500 focused blend" },
  ],
};

/** Resolve curated pairs for a product page; skips missing catalog entries. */
export function getRelatedProducts(slug: string): RelatedProduct[] {
  const entries = RELATED_PRODUCT_MAP[slug] ?? [];
  const related: RelatedProduct[] = [];

  for (const entry of entries) {
    if (entry.slug === slug) {
      continue;
    }
    const product = getProductBySlug(entry.slug);
    if (!product) {
      continue;
    }
    related.push({ product, reason: entry.reason });
  }

  return related;
}
