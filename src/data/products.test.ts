import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatPrice,
  getProductBySlug,
  getVariant,
  productCatalogImage,
  productDisplayName,
  productImageAlt,
  productPriceRange,
  productSpecRows,
  products,
} from "./products";
import { productSchema } from "@/lib/seo/structuredData";
import { productMetaDescription } from "@/lib/seo/productPageMetadata";

const BASE = "https://www.elevateprecisionhealth.com";

describe("productCatalogImage", () => {
  it("points at a committed WebP thumb for every SKU", () => {
    for (const product of products) {
      const href = productCatalogImage(product);
      expect(href).toBe(`/products/catalog/${product.slug}.webp`);
      const file = path.join(process.cwd(), "public", href.replace(/^\//, ""));
      expect(existsSync(file), `missing ${href}`).toBe(true);
    }
  });
});

describe("catalog integrity", () => {
  it("has unique slugs", () => {
    const slugs = products.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has unique variant SKUs", () => {
    const skus = products.flatMap((product) =>
      product.variants.map((variant) => variant.sku),
    );
    expect(new Set(skus).size).toBe(skus.length);
  });

  it("gives every product at least one variant with a positive price", () => {
    for (const product of products) {
      expect(product.variants.length).toBeGreaterThan(0);
      for (const variant of product.variants) {
        expect(variant.price).toBeGreaterThan(0);
      }
    }
  });

  it("gives every product the required research specs", () => {
    for (const product of products) {
      expect(product.specs.form.length).toBeGreaterThan(0);
      expect(product.specs.researchApplication.length).toBeGreaterThan(0);
      expect(product.specs.appearance.length).toBeGreaterThan(0);
      expect(product.specs.storage.length).toBeGreaterThan(0);
    }
  });

  it("gives every variant a packshot under /products/", () => {
    for (const product of products) {
      for (const variant of product.variants) {
        expect(variant.image).toMatch(/^\/products\/.+\.png$/);
      }
    }
  });

  it("features seven products including NAD+, GLOW Blend, and SS-31", () => {
    const featured = products.filter((product) => product.featured);
    expect(featured.map((product) => product.slug)).toEqual(
      expect.arrayContaining(["nad", "glow-blend", "ss-31"]),
    );
    expect(featured).toHaveLength(7);
  });
});

/** Obvious human-benefit / dosing claims — keep narrow to avoid chemistry false positives. */
const PROHIBITED_CLAIM_PATTERN =
  /\b(treat(?:s|ment|ing)?|cure[sd]?|prevent(?:s|ion|ing)?|diagnos(?:e|is|ing)|prescribed|dosage|inject(?:ion|ing|s)?(?:\s+instructions)?|for weight loss|burns? fat|builds? muscle|heals? injuries|improves? libido|safe for|effective for|guaranteed results)\b/i;

describe("product short descriptions", () => {
  it("gives every product a nonempty unique short description", () => {
    const descriptions = products.map((product) => product.shortDescription.trim());
    for (const description of descriptions) {
      expect(description.length).toBeGreaterThan(0);
    }
    expect(new Set(descriptions).size).toBe(products.length);
  });

  it("keeps short descriptions concise and research-framed", () => {
    for (const product of products) {
      const words = product.shortDescription.trim().split(/\s+/);
      expect(words.length).toBeGreaterThanOrEqual(10);
      expect(words.length).toBeLessThanOrEqual(32);
      expect(product.shortDescription).toMatch(
        /stud(?:y|ied|ies)|laboratory|research|diluent|blend|pathway|model/i,
      );
      expect(product.shortDescription).not.toMatch(PROHIBITED_CLAIM_PATTERN);
      expect(product.shortDescription).not.toMatch(/\bundefined\b/i);
    }
  });

  it("keeps Product JSON-LD description aligned with visible short copy", () => {
    for (const product of products) {
      const schema = productSchema(BASE, product, {});
      expect(schema.description).toBe(product.shortDescription);
    }
  });

  it("keeps metadata descriptions unique, framed, and free of prohibited claims", () => {
    const metas = products.map((product) => productMetaDescription(product));
    expect(new Set(metas).size).toBe(products.length);
    for (const meta of metas) {
      expect(meta.length).toBeLessThanOrEqual(320);
      expect(meta).toMatch(/Research use only/i);
      expect(meta).not.toMatch(PROHIBITED_CLAIM_PATTERN);
      expect(meta).not.toMatch(/\bundefined\b/i);
      expect(meta).not.toMatch(/\s{2,}/);
    }
  });
});

describe("productPriceRange", () => {
  it("returns min and max across variants", () => {
    const product = getProductBySlug("glp-3");
    expect(product).toBeDefined();
    const range = productPriceRange(product!);
    expect(range.min).toBe(79.99);
    expect(range.max).toBe(239.99);
  });
});

describe("formatPrice", () => {
  it("shows a single price when min equals max", () => {
    const product = getProductBySlug("mt-2");
    expect(formatPrice(product!)).toBe("$44.99");
  });

  it("shows a range when variants differ", () => {
    const product = getProductBySlug("glp-3");
    expect(formatPrice(product!)).toBe("$79.99 – $239.99");
  });
});

describe("getVariant", () => {
  it("finds a variant by size", () => {
    const product = getProductBySlug("glp-3");
    expect(getVariant(product!, "60mg")?.price).toBe(239.99);
  });

  it("returns undefined for an unknown size", () => {
    const product = getProductBySlug("glp-3");
    expect(getVariant(product!, "999mg")).toBeUndefined();
  });
});

describe("NAD+", () => {
  it("is listed as a coenzyme with 100mg, 500mg, and 1000mg variants", () => {
    const product = getProductBySlug("nad");
    expect(product).toBeDefined();
    expect(product!.name).toBe("NAD+");
    expect(product!.category).toBe("Coenzyme");
    expect(product!.variants.map((variant) => variant.size)).toEqual([
      "100mg",
      "500mg",
      "1000mg",
    ]);
    expect(getVariant(product!, "100mg")?.sku).toBe("NAD-100MG");
    expect(getVariant(product!, "500mg")?.sku).toBe("NAD-500MG");
    expect(getVariant(product!, "1000mg")?.sku).toBe("NAD-1000MG");
  });

  it("includes verified molecular identity fields", () => {
    const product = getProductBySlug("nad");
    expect(product!.specs.molecularFormula).toBe("C21H26N7O14P2");
    expect(product!.specs.molecularWeight).toBe("663.43 g/mol");
    expect(product!.specs.form).toBe("Lyophilized powder");
  });
});

describe("productSpecRows", () => {
  it("omits optional fields that are not set", () => {
    const product = getProductBySlug("wolverine-blend");
    const labels = productSpecRows(product!).map((row) => row.label);
    expect(labels).toContain("Form");
    expect(labels).toContain("Composition");
    expect(labels).not.toContain("Molecular formula");
    expect(labels).not.toContain("Molecular weight");
  });

  it("includes composition for blends", () => {
    const product = getProductBySlug("wolverine-blend");
    const composition = productSpecRows(product!).find(
      (row) => row.label === "Composition",
    );
    expect(composition?.value).toMatch(/BPC-157/);
    expect(composition?.value).toMatch(/TB-500/);
  });
});

describe("KLOW Blend", () => {
  it("is listed as an 80mg four-peptide blend with KPV", () => {
    const product = getProductBySlug("klow-blend");
    expect(product).toBeDefined();
    expect(product!.name).toBe("KLOW Blend");
    expect(product!.category).toBe("Blend");
    expect(product!.featured).toBe(false);
    expect(product!.variants.map((variant) => variant.size)).toEqual(["80mg"]);
    expect(getVariant(product!, "80mg")?.sku).toBe("KLOW-80MG");
    expect(getVariant(product!, "80mg")?.image).toBe(
      "/products/klow-blend-80mg.png",
    );
    expect(product!.specs.composition).toMatch(/BPC-157/);
    expect(product!.specs.composition).toMatch(/GHK-Cu/);
    expect(product!.specs.composition).toMatch(/TB-500/);
    expect(product!.specs.composition).toMatch(/KPV/);
  });
});

describe("GLP catalog identities", () => {
  it("maps GLP-3 to retatrutide chemistry", () => {
    const product = getProductBySlug("glp-3");
    expect(product!.specs.molecularFormula).toBe("C221H342N46O68");
    expect(product!.specs.molecularWeight).toBe("4731.33 g/mol");
    expect(product!.specs.synonyms).toMatch(/Retatrutide/);
  });

  it("maps GLP-2 to tirzepatide chemistry", () => {
    const product = getProductBySlug("glp-2");
    expect(product!.specs.molecularFormula).toBe("C225H348N48O68");
    expect(product!.specs.molecularWeight).toBe("4813.45 g/mol");
    expect(product!.specs.synonyms).toMatch(/Tirzepatide/);
  });
});

describe("SS-31", () => {
  it("is listed as a featured 10mg elamipretide peptide", () => {
    const product = getProductBySlug("ss-31");
    expect(product).toBeDefined();
    expect(product!.name).toBe("SS-31");
    expect(product!.category).toBe("Peptide");
    expect(product!.featured).toBe(true);
    expect(product!.variants.map((variant) => variant.size)).toEqual(["10mg"]);
    expect(getVariant(product!, "10mg")?.sku).toBe("SS31-10MG");
    expect(getVariant(product!, "10mg")?.image).toBe("/products/ss-31-10mg.png");
    expect(getVariant(product!, "10mg")?.price).toBe(54.99);
    expect(product!.specs.molecularFormula).toBe("C32H49N9O5");
    expect(product!.specs.molecularWeight).toBe("639.8 g/mol");
    expect(product!.specs.sequence).toBe("D-Arg-Dmt-Lys-Phe-NH2");
    expect(product!.specs.synonyms).toMatch(/Elamipretide/);
  });
});

describe("PT-141", () => {
  it("is listed as a 10mg bremelanotide peptide with COA-backed identity fields", () => {
    const product = getProductBySlug("pt-141");
    expect(product).toBeDefined();
    expect(product!.name).toBe("PT-141");
    expect(product!.category).toBe("Peptide");
    expect(product!.featured).toBe(false);
    expect(product!.variants.map((variant) => variant.size)).toEqual(["10mg"]);
    expect(getVariant(product!, "10mg")?.sku).toBe("PT141-10MG");
    expect(getVariant(product!, "10mg")?.image).toBe(
      "/products/pt-141-10mg.png",
    );
    expect(getVariant(product!, "10mg")?.price).toBe(49.99);
    expect(product!.specs.molecularWeight).toBe("1025.2 g/mol");
    expect(product!.specs.sequence).toBe(
      "Ac-Nle-cyclo[Asp-His-D-Phe-Arg-Trp-Lys]-OH",
    );
    expect(product!.specs.synonyms).toMatch(/Bremelanotide/);
    expect(product!.specs.molecularFormula).toBeUndefined();
  });
});

describe("productImageAlt", () => {
  it("builds descriptive alt text from name, size, and category for every SKU", () => {
    for (const product of products) {
      const alt = productImageAlt(product);
      expect(alt.length).toBeGreaterThan(0);
      expect(alt).toContain(product.name);
      expect(alt).toMatch(/research/i);
      expect(alt).toContain(product.category.toLowerCase());
      expect(alt).toContain(product.variants[0]!.size);
    }
  });

  it("matches the audit-style example for a featured peptide", () => {
    expect(productImageAlt(getProductBySlug("glp-3")!)).toBe(
      "GLP-3 (Retatrutide) 10mg research peptide",
    );
  });
});

describe("productDisplayName", () => {
  it("puts the common name in parentheses for coded catalog SKUs", () => {
    expect(productDisplayName(getProductBySlug("glp-3")!)).toBe(
      "GLP-3 (Retatrutide)",
    );
    expect(productDisplayName(getProductBySlug("glp-2")!)).toBe(
      "GLP-2 (Tirzepatide)",
    );
    expect(productDisplayName(getProductBySlug("mt-2")!)).toBe(
      "MT-2 (Melanotan)",
    );
    expect(productDisplayName(getProductBySlug("pt-141")!)).toBe(
      "PT-141 (Bremelanotide)",
    );
    expect(productDisplayName(getProductBySlug("ss-31")!)).toBe(
      "SS-31 (Elamipretide)",
    );
  });

  it("leaves products without a short common name unchanged", () => {
    expect(productDisplayName(getProductBySlug("nad")!)).toBe("NAD+");
    expect(productDisplayName(getProductBySlug("mots-c")!)).toBe("MOTS-c");
    expect(productDisplayName(getProductBySlug("tesamorelin")!)).toBe(
      "Tesamorelin",
    );
  });
});
