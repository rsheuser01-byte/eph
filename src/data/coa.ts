import { getProductBySlug, products } from "./products";
import { trustSignals } from "./trustSignals";

export type CoaDocument = {
  /** Product catalog slug this certificate belongs to. */
  productSlug: string;
  /** Public URL path under /public (served at site root). */
  href: string;
  /** Optional note shown next to the link (e.g. lot / size on the file). */
  note?: string;
  /**
   * Lot purity as stated on the published certificate (e.g. "99.85%").
   * Omit when the file does not report an overall purity figure.
   */
  purity?: string;
  /**
   * Analytical methods named on the certificate (e.g. "FTIR and HPLC").
   * Omit when the file does not name a method — do not invent HPLC/LC-MS.
   */
  testMethods?: string;
  /** Lab that issued the published certificate. */
  testingLabName?: string;
  testingLabUrl?: string;
};

/**
 * Certificate-backed assay signals for a catalog product.
 * Purity and methods come only from published COAs — never invented.
 */
export type ProductAssaySignals = {
  purity: string | null;
  testMethods: string | null;
  testingLabName: string | null;
  testingLabUrl: string | null;
  coaHref: string | null;
  coaNote: string | null;
  hasPublishedCoa: boolean;
};

/**
 * Published certificates of analysis. Add a row when a new PDF lands in
 * `web/public/coa/{slug}.pdf` (URL-safe filename matching the product slug).
 * Purity / method / lab fields must match the PDF — do not invent values.
 */
export const coaDocuments: readonly CoaDocument[] = [
  {
    productSlug: "glp-3",
    href: "/coa/glp-3.pdf",
    purity: "99.85%",
    testingLabName: "North South Precision Testing",
    testingLabUrl: "https://www.msds-ghs.cn",
  },
  {
    productSlug: "glp-2",
    href: "/coa/glp-2.pdf",
    purity: "99.23%",
    testMethods: "HPLC",
    testingLabName: "SENOBIO",
  },
  {
    productSlug: "nad",
    href: "/coa/nad.pdf",
    purity: "99.89%",
    testingLabName: "North South Precision Testing",
    testingLabUrl: "https://www.msds-ghs.cn",
  },
  {
    productSlug: "glow-blend",
    href: "/coa/glow-blend.pdf",
    purity: "99.7%",
    testMethods: "FTIR and HPLC",
    testingLabName: "BT Lab Testing",
    testingLabUrl: "https://btlabtesting.com",
  },
  {
    productSlug: "klow-blend",
    href: "/coa/klow-blend.pdf",
    testingLabName: "Janoshik",
    testingLabUrl: "https://www.janoshik.com",
  },
  {
    productSlug: "tesamorelin",
    href: "/coa/tesamorelin.pdf",
    purity: "99.4%",
    testMethods: "HPLC",
    testingLabName: "SENOBIO",
  },
  {
    productSlug: "pt-141",
    href: "/coa/pt-141.pdf",
    purity: "99.4%",
    testMethods: "HPLC",
    testingLabName: "SENOBIO",
  },
] as const;

export function getCoaForProduct(slug: string): CoaDocument | undefined {
  return coaDocuments.find((doc) => doc.productSlug === slug);
}

/**
 * Human-visible assay signals for product pages and catalog cards.
 * Published COA wins; otherwise partner name + on-request (no fake purity %).
 */
export function getProductAssaySignals(slug: string): ProductAssaySignals {
  const coa = getCoaForProduct(slug);
  if (coa) {
    return {
      purity: coa.purity ?? null,
      testMethods: coa.testMethods ?? null,
      testingLabName: coa.testingLabName ?? null,
      testingLabUrl: coa.testingLabUrl ?? null,
      coaHref: coa.href,
      coaNote: coa.note ?? null,
      hasPublishedCoa: true,
    };
  }

  return {
    purity: null,
    testMethods: null,
    testingLabName: trustSignals.testingLabName,
    testingLabUrl: trustSignals.testingLabUrl,
    coaHref: null,
    coaNote: null,
    hasPublishedCoa: false,
  };
}

export function listPublishedCoas(): ReadonlyArray<
  CoaDocument & { productName: string }
> {
  return coaDocuments
    .map((doc) => {
      const product = getProductBySlug(doc.productSlug);
      return product
        ? { ...doc, productName: product.name }
        : null;
    })
    .filter((doc): doc is CoaDocument & { productName: string } => doc !== null);
}

/** Catalog products that still need a public certificate uploaded. */
export function productsWithoutPublishedCoa(): ReadonlyArray<{
  slug: string;
  name: string;
}> {
  const published = new Set(coaDocuments.map((doc) => doc.productSlug));
  return products
    .filter((product) => !published.has(product.slug))
    .map((product) => ({ slug: product.slug, name: product.name }));
}
