import { listPrice } from "./pricing";

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
  /**
   * Short public INN / common name shown next to the catalog code
   * (e.g. Retatrutide for GLP-3). Omit when the catalog name is already
   * the recognizable name.
   */
  commonName?: string;
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
  "Store lyophilized powder at −20°C. Protect from light and moisture. Keep tightly sealed until use. After preparing a laboratory stock solution, store at 2–8°C.";

// List prices come from pricing-guide.json (edit that file to change prices).
export const products: Product[] = [
  {
    slug: "glp-3",
    name: "GLP-3",
    commonName: "Retatrutide",
    sku: "GLP-3",
    category: "Peptide",
    shortDescription:
      "Triple-receptor agonist studied in laboratory models involving GIP, GLP-1 and glucagon signaling pathways.",
    featured: true,
    variants: [
      {
        size: "10mg",
        price: listPrice("glp-3", "10mg"),
        sku: "GLP-3-10MG",
        image: "/products/glp-3-10mg.png",
      },
      {
        size: "15mg",
        price: listPrice("glp-3", "15mg"),
        sku: "GLP-3-15MG",
        image: "/products/glp-3-15mg.png",
      },
      {
        size: "30mg",
        price: listPrice("glp-3", "30mg"),
        sku: "GLP-3-30MG",
        image: "/products/glp-3-30mg.png",
      },
      {
        size: "60mg",
        price: listPrice("glp-3", "60mg"),
        sku: "GLP-3-60MG",
        image: "/products/glp-3-60mg.png",
      },
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
    commonName: "Tirzepatide",
    sku: "GLP-2",
    category: "Peptide",
    shortDescription:
      "Dual incretin agonist studied in laboratory models involving GIP and GLP-1 receptor signaling.",
    featured: true,
    variants: [
      {
        size: "10mg",
        price: listPrice("glp-2", "10mg"),
        sku: "GLP-2-10MG",
        image: "/products/glp-2-10mg.png",
      },
      {
        size: "20mg",
        price: listPrice("glp-2", "20mg"),
        sku: "GLP-2-20MG",
        image: "/products/glp-2-20mg.png",
      },
      {
        size: "30mg",
        price: listPrice("glp-2", "30mg"),
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
      "Mitochondrial-derived peptide studied for its role in cellular energy signaling and metabolic stress pathways.",
    featured: true,
    variants: [
      {
        size: "10mg",
        price: listPrice("mots-c", "10mg"),
        sku: "MOTS-10MG",
        image: "/products/mots-c-10mg.png",
      },
      {
        size: "20mg",
        price: listPrice("mots-c", "20mg"),
        sku: "MOTS-20MG",
        image: "/products/mots-c-20mg.png",
      },
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
    slug: "ss-31",
    name: "SS-31",
    commonName: "Elamipretide",
    sku: "SS31",
    category: "Peptide",
    shortDescription:
      "Mitochondria-targeted tetrapeptide studied in laboratory models of inner-membrane association and cardiolipin-linked assays.",
    featured: true,
    variants: [
      {
        size: "10mg",
        price: listPrice("ss-31", "10mg"),
        sku: "SS31-10MG",
        image: "/products/ss-31-10mg.png",
      },
    ],
    specs: {
      form: LYOPHILIZED,
      researchApplication:
        "Mitochondria-targeted tetrapeptide studies of inner-membrane association and cardiolipin-linked pathways in vitro.",
      molecularFormula: "C32H49N9O5",
      molecularWeight: "639.8 g/mol",
      sequence: "D-Arg-Dmt-Lys-Phe-NH2",
      appearance: POWDER_APPEARANCE,
      storage: LYOPHILIZED_STORAGE,
      synonyms: "Elamipretide, MTP-131, Bendavia",
    },
  },
  {
    slug: "tesamorelin",
    name: "Tesamorelin",
    sku: "TESA",
    category: "Peptide",
    shortDescription:
      "Synthetic GHRH analog studied in laboratory models of growth hormone-releasing hormone receptor signaling.",
    featured: false,
    variants: [
      {
        size: "5mg",
        price: listPrice("tesamorelin", "5mg"),
        sku: "TESA-5MG",
        image: "/products/tesamorelin-5mg.png",
      },
      {
        size: "10mg",
        price: listPrice("tesamorelin", "10mg"),
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
    slug: "semax",
    name: "Semax",
    sku: "SEMAX",
    category: "Peptide",
    shortDescription:
      "Synthetic ACTH(4-7) analog with a C-terminal Pro-Gly-Pro motif studied in laboratory peptide-identity and analog-comparison models.",
    featured: true,
    variants: [
      {
        size: "10mg",
        price: listPrice("semax", "10mg"),
        sku: "SEMAX-10MG",
        image: "/products/semax-10mg.png",
      },
    ],
    specs: {
      form: LYOPHILIZED,
      researchApplication:
        "ACTH(4-7)-PGP heptapeptide analog studies in controlled laboratory models.",
      molecularFormula: "C37H51N9O10S",
      molecularWeight: "813.9 g/mol",
      sequence: "Met-Glu-His-Phe-Pro-Gly-Pro",
      appearance: POWDER_APPEARANCE,
      storage: LYOPHILIZED_STORAGE,
      synonyms: "ACTH(4-7)-PGP, MEHFPGP",
    },
  },
  {
    slug: "mt-2",
    name: "MT-2",
    commonName: "Melanotan",
    sku: "MT2",
    category: "Peptide",
    shortDescription:
      "Cyclic melanocortin analog studied in laboratory models of pigment pathway and melanocortin receptor signaling.",
    featured: false,
    variants: [
      {
        size: "10mg",
        price: listPrice("mt-2", "10mg"),
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
      synonyms: "Melanotan, Melanotan II",
    },
  },
  {
    slug: "pt-141",
    name: "PT-141",
    commonName: "Bremelanotide",
    sku: "PT141",
    category: "Peptide",
    shortDescription:
      "Cyclic melanocortin peptide studied for receptor signaling comparisons across melanocortin pathway models.",
    featured: false,
    variants: [
      {
        size: "10mg",
        price: listPrice("pt-141", "10mg"),
        sku: "PT141-10MG",
        image: "/products/pt-141-10mg.png",
      },
    ],
    specs: {
      form: LYOPHILIZED,
      researchApplication:
        "Melanocortin receptor signaling studies in controlled laboratory models.",
      molecularWeight: "1025.2 g/mol",
      sequence: "Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-OH",
      appearance: POWDER_APPEARANCE,
      storage: LYOPHILIZED_STORAGE,
      synonyms: "Bremelanotide",
    },
  },
  {
    slug: "nad",
    name: "NAD+",
    sku: "NAD",
    category: "Coenzyme",
    shortDescription:
      "Cellular cofactor studied in laboratory models involving energy metabolism, redox activity and enzyme function.",
    featured: true,
    variants: [
      {
        size: "100mg",
        price: listPrice("nad", "100mg"),
        sku: "NAD-100MG",
        image: "/products/nad-100mg.png",
      },
      {
        size: "500mg",
        price: listPrice("nad", "500mg"),
        sku: "NAD-500MG",
        image: "/products/nad-500mg.png",
      },
      {
        size: "1000mg",
        price: listPrice("nad", "1000mg"),
        sku: "NAD-1000MG",
        image: "/products/nad-1000mg.png",
      },
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
    slug: "5-amino-1mq",
    name: "5-Amino-1MQ",
    sku: "5A1MQ",
    category: "Small molecule",
    shortDescription:
      "Membrane-permeable quinolinium compound studied in laboratory models of nicotinamide N-methyltransferase (NNMT) inhibition.",
    featured: true,
    variants: [
      {
        size: "50mg",
        price: listPrice("5-amino-1mq", "50mg"),
        sku: "5A1MQ-50MG",
        image: "/products/5-amino-1mq-50mg.png",
      },
    ],
    specs: {
      form: LYOPHILIZED,
      researchApplication:
        "Nicotinamide N-methyltransferase (NNMT) inhibition studies in controlled laboratory models.",
      molecularFormula: "C10H11IN2",
      molecularWeight: "286.11 g/mol",
      appearance: POWDER_APPEARANCE,
      storage: LYOPHILIZED_STORAGE,
      synonyms:
        "5-amino-1-methylquinolinium iodide, NNMTi, 5-amino-1MQ",
    },
  },
  {
    slug: "wolverine-blend",
    name: "Wolverine Blend",
    sku: "WOLV",
    category: "Blend",
    shortDescription:
      "Combined BPC-157 and TB-500 preparation studied in multi-marker laboratory protocols from a single stock.",
    featured: true,
    variants: [
      {
        size: "20mg",
        price: listPrice("wolverine-blend", "20mg"),
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
      "Three-peptide blend with BPC-157, GHK-Cu and TB-500 studied in coordinated multi-marker laboratory designs.",
    featured: true,
    variants: [
      {
        size: "70mg",
        price: listPrice("glow-blend", "70mg"),
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
      "Four-peptide blend adding KPV alongside BPC-157, GHK-Cu and TB-500 for broader marker-panel study designs.",
    featured: false,
    variants: [
      {
        size: "80mg",
        price: listPrice("klow-blend", "80mg"),
        sku: "KLOW-80MG",
        image: "/products/klow-blend-80mg.png",
      },
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

/** Catalog code plus common name when one is set, e.g. "GLP-3 (Retatrutide)". */
export function productDisplayName(
  product: Pick<Product, "name" | "commonName">,
): string {
  if (!product.commonName) {
    return product.name;
  }
  return `${product.name} (${product.commonName})`;
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

/**
 * Lightweight WebP thumb for dense catalog grids (homepage).
 * Generated by `npm run generate:catalog-thumbs` from the primary packshot.
 */
export function productCatalogImage(product: Product): string {
  return `/products/catalog/${product.slug}.webp`;
}

/** Descriptive alt for catalog/listing packshots (not empty decorative alt). */
export function productImageAlt(product: Product): string {
  const size = product.variants[0]?.size;
  const kind = product.category.toLowerCase();
  const label = productDisplayName(product);
  if (size) {
    return `${label} ${size} research ${kind}`;
  }
  return `${label} research ${kind}`;
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
