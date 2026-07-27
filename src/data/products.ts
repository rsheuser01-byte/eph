export type ProductVariant = {
  size: string;
  price: number;
  sku: string;
  /** Public path to the packshot for this vial size, e.g. `/products/nad-100mg.png`. */
  image: string;
};

/**
 * Research-facing product attributes shown on the product detail page.
 * Optional chemistry fields are omitted when a single formula does not apply
 * (blends) or when identity is not yet confirmed.
 */
export type ProductSpecs = {
  form: string;
  researchApplication: string;
  appearance: string;
  storage: string;
  molecularFormula?: string;
  molecularWeight?: string;
  sequence?: string;
  composition?: string;
  synonyms?: string;
};

export type Product = {
  slug: string;
  name: string;
  sku: string;
  category: string;
  shortDescription: string;
  featured: boolean;
  variants: ProductVariant[];
  specs: ProductSpecs;
};

export type ProductSpecRow = {
  label: string;
  value: string;
};

const LYOPHILIZED = "Lyophilized powder";
const POWDER_APPEARANCE = "White to off-white powder";
const LYOPHILIZED_STORAGE =
  "Store lyophilized powder at −20°C. Protect from light and moisture. Keep tightly sealed until use.";

// Prices/sizes seeded from the Bourbon Peptides catalog. Values marked
// PLACEHOLDER are interpolated or assumed and should be confirmed.
export const products: Product[] = [
  {
    slug: "glp-3",
    name: "GLP-3",
    sku: "GLP-3",
    category: "Peptide",
    shortDescription:
      "Retatrutide research peptide supplied in multiple vial sizes for laboratory protocols.",
    featured: true,
    variants: [
      {
        size: "15mg",
        price: 69.99,
        sku: "GLP-3-15MG",
        image: "/products/glp-3-15mg.png",
      }, // PLACEHOLDER price
      {
        size: "30mg",
        price: 129.99,
        sku: "GLP-3-30MG",
        image: "/products/glp-3-30mg.png",
      }, // PLACEHOLDER price
      {
        size: "60mg",
        price: 189.99,
        sku: "GLP-3-60MG",
        image: "/products/glp-3-60mg.png",
      }, // PLACEHOLDER price
    ],
    specs: {
      form: LYOPHILIZED,
      researchApplication:
        "Triple agonist (GIP, GLP-1, and glucagon receptor) signaling studies in controlled laboratory models.",
      molecularFormula: "C221H342N46O68",
      molecularWeight: "4731.33 g/mol",
      appearance: POWDER_APPEARANCE,
      storage: LYOPHILIZED_STORAGE,
      synonyms: "Retatrutide, LY3437943",
    },
  },
  {
    slug: "glp-2",
    name: "GLP-2",
    sku: "GLP-2",
    category: "Peptide",
    shortDescription:
      "Tirzepatide research peptide suited to early screening and repeat assay work.",
    featured: true,
    variants: [
      {
        size: "10mg",
        price: 44.99,
        sku: "GLP-2-10MG",
        image: "/products/glp-2-10mg.png",
      },
      {
        size: "20mg",
        price: 62.49,
        sku: "GLP-2-20MG",
        image: "/products/glp-2-20mg.png",
      }, // PLACEHOLDER price
      {
        size: "30mg",
        price: 79.99,
        sku: "GLP-2-30MG",
        image: "/products/glp-2-30mg.png",
      },
    ],
    specs: {
      form: LYOPHILIZED,
      researchApplication:
        "Dual GIP and GLP-1 receptor agonist studies in controlled laboratory models.",
      molecularFormula: "C225H348N48O68",
      molecularWeight: "4813.45 g/mol",
      appearance: POWDER_APPEARANCE,
      storage: LYOPHILIZED_STORAGE,
      synonyms: "Tirzepatide, LY3298176",
    },
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
      {
        size: "10mg",
        price: 30.0,
        sku: "MOTS-10MG",
        image: "/products/mots-c-10mg.png",
      }, // PLACEHOLDER size/price
      {
        size: "20mg",
        price: 84.99,
        sku: "MOTS-20MG",
        image: "/products/mots-c-20mg.png",
      }, // PLACEHOLDER size/price
    ],
    specs: {
      form: LYOPHILIZED,
      researchApplication:
        "Mitochondrial-encoded peptide studies of metabolic and cellular stress pathways in vitro.",
      molecularFormula: "C101H152N28O22S2",
      molecularWeight: "2174.6 g/mol",
      sequence: "MRWQEMGYIFYPRK",
      appearance: POWDER_APPEARANCE,
      storage: LYOPHILIZED_STORAGE,
      synonyms: "Mitochondrial open reading frame of the 12S rRNA type-c",
    },
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
      {
        size: "5mg",
        price: 49.99,
        sku: "TESA-5MG",
        image: "/products/tesamorelin-5mg.png",
      }, // PLACEHOLDER price
      {
        size: "10mg",
        price: 59.99,
        sku: "TESA-10MG",
        image: "/products/tesamorelin-10mg.png",
      },
    ],
    specs: {
      form: LYOPHILIZED,
      researchApplication:
        "Growth hormone-releasing hormone (GHRH) analog studies in controlled laboratory settings.",
      molecularFormula: "C221H366N72O67S",
      molecularWeight: "5135.9 g/mol",
      appearance: POWDER_APPEARANCE,
      storage: LYOPHILIZED_STORAGE,
      synonyms: "TH9507",
    },
  },
  {
    slug: "mt-2",
    name: "MT-2",
    sku: "MT2",
    category: "Peptide",
    shortDescription:
      "Melanotan II research peptide for receptor and pigment pathway studies.",
    featured: false,
    variants: [
      {
        size: "10mg",
        price: 39.99,
        sku: "MT2-10MG",
        image: "/products/mt-2-10mg.png",
      },
    ],
    specs: {
      form: LYOPHILIZED,
      researchApplication:
        "Melanocortin receptor and pigmentation pathway research in laboratory models.",
      molecularFormula: "C50H69N15O9",
      molecularWeight: "1024.18 g/mol",
      sequence: "Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-NH2",
      appearance: POWDER_APPEARANCE,
      storage: LYOPHILIZED_STORAGE,
      synonyms: "Melanotan II, Melanotan 2",
    },
  },
  {
    slug: "nad",
    name: "NAD+",
    sku: "NAD",
    category: "Peptide",
    shortDescription:
      "Nicotinamide adenine dinucleotide for cellular metabolism and redox pathway laboratory models.",
    featured: true,
    variants: [
      {
        size: "100mg",
        price: 49.99,
        sku: "NAD-100MG",
        image: "/products/nad-100mg.png",
      }, // PLACEHOLDER price
      {
        size: "500mg",
        price: 149.99,
        sku: "NAD-500MG",
        image: "/products/nad-500mg.png",
      }, // PLACEHOLDER price
    ],
    specs: {
      form: LYOPHILIZED,
      researchApplication:
        "Cellular redox, energy metabolism, and NAD+-dependent enzyme assays in vitro.",
      molecularFormula: "C21H26N7O14P2",
      molecularWeight: "663.43 g/mol",
      appearance: "White to yellowish powder",
      storage: LYOPHILIZED_STORAGE,
      synonyms: "Nicotinamide adenine dinucleotide (oxidized form)",
    },
  },
  {
    slug: "wolverine-blend",
    name: "Wolverine Blend",
    sku: "WOLV",
    category: "Blend",
    shortDescription:
      "BPC-157 with TB-500 in one research blend for combined study designs.",
    featured: true,
    variants: [
      {
        size: "20mg",
        price: 79.95,
        sku: "WOLV-20MG",
        image: "/products/wolverine-blend-20mg.png",
      },
    ],
    specs: {
      form: LYOPHILIZED,
      researchApplication:
        "Combined BPC-157 and TB-500 protocols for multi-marker laboratory study designs.",
      composition: "BPC-157 and TB-500",
      appearance: POWDER_APPEARANCE,
      storage: LYOPHILIZED_STORAGE,
    },
  },
  {
    slug: "glow-blend",
    name: "GLOW Blend",
    sku: "GLOW",
    category: "Blend",
    shortDescription:
      "BPC-157, GHK-Cu, and TB-500 combined for multi-marker lab protocols.",
    featured: true,
    variants: [
      {
        size: "70mg",
        price: 84.99,
        sku: "GLOW-70MG",
        image: "/products/glow-blend-70mg.png",
      },
    ],
    specs: {
      form: LYOPHILIZED,
      researchApplication:
        "Multi-peptide protocols combining BPC-157, GHK-Cu, and TB-500 for laboratory marker studies.",
      composition: "BPC-157, GHK-Cu, and TB-500",
      appearance: POWDER_APPEARANCE,
      storage: LYOPHILIZED_STORAGE,
    },
  },
  {
    slug: "klow-blend",
    name: "KLOW Blend",
    sku: "KLOW",
    category: "Blend",
    shortDescription:
      "BPC-157, GHK-Cu, TB-500, and KPV combined for multi-marker lab protocols.",
    featured: false,
    variants: [
      {
        size: "80mg",
        price: 94.99,
        sku: "KLOW-80MG",
        image: "/products/klow-blend-80mg.png",
      }, // PLACEHOLDER price
    ],
    specs: {
      form: LYOPHILIZED,
      researchApplication:
        "Multi-peptide protocols combining BPC-157, GHK-Cu, TB-500, and KPV for laboratory marker studies.",
      composition: "BPC-157, GHK-Cu, TB-500, and KPV",
      appearance: POWDER_APPEARANCE,
      storage: LYOPHILIZED_STORAGE,
    },
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
      {
        size: "10ml",
        price: 4.99,
        sku: "BAC-10ML",
        image: "/products/bac-10ml.png",
      }, // PLACEHOLDER size/price
      {
        size: "30ml",
        price: 7.99,
        sku: "BAC-30ML",
        image: "/products/bac-30ml.png",
      }, // PLACEHOLDER size/price
    ],
    specs: {
      form: "Sterile aqueous solution with bacteriostatic preservative",
      researchApplication:
        "Reconstitution diluent for lyophilized research materials on the laboratory bench.",
      molecularFormula: "H2O (with benzyl alcohol preservative)",
      appearance: "Clear, colorless liquid",
      storage:
        "Store at controlled room temperature. Protect from light. Do not freeze.",
      synonyms: "Bacteriostatic water",
    },
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

/** Default packshot for listings (first vial size). */
export function productPrimaryImage(product: Product): string {
  return product.variants[0]?.image ?? "";
}

/** Ordered rows for the product detail specs table (skips unset optionals). */
export function productSpecRows(product: Product): ProductSpecRow[] {
  const { specs } = product;
  const rows: Array<[string, string | undefined]> = [
    ["Form", specs.form],
    ["Research application", specs.researchApplication],
    ["Composition", specs.composition],
    ["Molecular formula", specs.molecularFormula],
    ["Molecular weight", specs.molecularWeight],
    ["Sequence", specs.sequence],
    ["Appearance", specs.appearance],
    ["Recommended storage", specs.storage],
    ["Also known as", specs.synonyms],
  ];

  return rows
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([label, value]) => ({ label, value }));
}
