export type ProductVariant = {
  size: string;
  price: number;
  sku: string;
};

export type Product = {
  slug: string;
  name: string;
  sku: string;
  category: string;
  shortDescription: string;
  featured: boolean;
  variants: ProductVariant[];
};

// Prices/sizes seeded from the Bourbon Peptides catalog. Values marked
// PLACEHOLDER are interpolated or assumed and should be confirmed.
export const products: Product[] = [
  {
    slug: "bp-3r",
    name: "BP-3R",
    sku: "BP-3R",
    category: "Peptide",
    shortDescription:
      "Multi-size research vials for protocols that need flexible working quantities.",
    featured: true,
    variants: [
      { size: "20mg", price: 69.99, sku: "BP-3R-20MG" },
      { size: "30mg", price: 129.99, sku: "BP-3R-30MG" }, // PLACEHOLDER price
      { size: "50mg", price: 189.99, sku: "BP-3R-50MG" },
    ],
  },
  {
    slug: "bp-2t",
    name: "BP-2T",
    sku: "BP-2T",
    category: "Peptide",
    shortDescription:
      "Compact research SKU suited to early screening and repeat assay work.",
    featured: true,
    variants: [
      { size: "10mg", price: 44.99, sku: "BP-2T-10MG" },
      { size: "20mg", price: 62.49, sku: "BP-2T-20MG" }, // PLACEHOLDER price
      { size: "30mg", price: 79.99, sku: "BP-2T-30MG" },
    ],
  },
  {
    slug: "mots-c",
    name: "MOTS-c",
    sku: "MOTS",
    category: "Peptide",
    shortDescription:
      "Mitochondrial peptide used in metabolic pathway laboratory models.",
    featured: true,
    variants: [
      { size: "10mg", price: 30.0, sku: "MOTS-10MG" }, // PLACEHOLDER size/price
      { size: "20mg", price: 84.99, sku: "MOTS-20MG" }, // PLACEHOLDER size/price
    ],
  },
  {
    slug: "tesamorelin",
    name: "Tesamorelin",
    sku: "TESA",
    category: "Peptide",
    shortDescription:
      "GHRH analog stocked for controlled in-vitro and research bench use.",
    featured: false,
    variants: [
      { size: "5mg", price: 49.99, sku: "TESA-5MG" }, // PLACEHOLDER price
      { size: "10mg", price: 59.99, sku: "TESA-10MG" },
    ],
  },
  {
    slug: "mt-2",
    name: "MT-2",
    sku: "MT2",
    category: "Peptide",
    shortDescription:
      "Melanocortin research peptide for receptor and pigment pathway studies.",
    featured: false,
    variants: [{ size: "10mg", price: 39.99, sku: "MT2-10MG" }],
  },
  {
    slug: "wolverine-blend",
    name: "Wolverine Blend",
    sku: "WOLV",
    category: "Blend",
    shortDescription:
      "BPC-157 with TB-500 in one research blend for combined study designs.",
    featured: true,
    variants: [{ size: "20mg", price: 79.95, sku: "WOLV-20MG" }],
  },
  {
    slug: "glow-blend",
    name: "GLOW Blend",
    sku: "GLOW",
    category: "Blend",
    shortDescription:
      "BPC-157, GHK-Cu, and TB-500 combined for multi-marker lab protocols.",
    featured: false,
    variants: [{ size: "70mg", price: 84.99, sku: "GLOW-70MG" }],
  },
  {
    slug: "bac",
    name: "BAC Water",
    sku: "BAC",
    category: "Supply",
    shortDescription:
      "Bacteriostatic water for reconstitution steps on the research bench.",
    featured: false,
    variants: [
      { size: "10ml", price: 4.99, sku: "BAC-10ML" }, // PLACEHOLDER size/price
      { size: "30ml", price: 7.99, sku: "BAC-30ML" }, // PLACEHOLDER size/price
    ],
  },
];

export function productPriceRange(product: Product): {
  min: number;
  max: number;
} {
  const prices = product.variants.map((variant) => variant.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function formatPrice(product: Product): string {
  const { min, max } = productPriceRange(product);
  if (min === max) {
    return `$${min.toFixed(2)}`;
  }
  return `$${min.toFixed(2)} – $${max.toFixed(2)}`;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getVariant(
  product: Product,
  size: string,
): ProductVariant | undefined {
  return product.variants.find((variant) => variant.size === size);
}
