import { describe, expect, it } from "vitest";
import {
  formatPrice,
  getProductBySlug,
  getVariant,
  productPriceRange,
  productSpecRows,
  products,
} from "./products";

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

  it("features six products including NAD+ and GLOW Blend", () => {
    const featured = products.filter((product) => product.featured);
    expect(featured.map((product) => product.slug)).toEqual(
      expect.arrayContaining(["nad", "glow-blend"]),
    );
    expect(featured).toHaveLength(6);
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
  it("is listed with 100mg, 500mg, and 1000mg variants", () => {
    const product = getProductBySlug("nad");
    expect(product).toBeDefined();
    expect(product!.name).toBe("NAD+");
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
