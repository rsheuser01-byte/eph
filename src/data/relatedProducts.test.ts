import { describe, expect, it } from "vitest";
import { products } from "@/data/products";
import {
  RELATED_PRODUCT_MAP,
  getRelatedProducts,
} from "./relatedProducts";

describe("relatedProducts map", () => {
  it("covers every catalog product with 2–4 curated pairs", () => {
    for (const product of products) {
      const entries = RELATED_PRODUCT_MAP[product.slug];
      expect(entries, `missing map for ${product.slug}`).toBeDefined();
      expect(entries!.length).toBeGreaterThanOrEqual(2);
      expect(entries!.length).toBeLessThanOrEqual(4);
    }
  });

  it("only references real catalog slugs and never self-links", () => {
    const catalog = new Set(products.map((product) => product.slug));

    for (const [slug, entries] of Object.entries(RELATED_PRODUCT_MAP)) {
      expect(catalog.has(slug)).toBe(true);
      const seen = new Set<string>();
      for (const entry of entries) {
        expect(catalog.has(entry.slug)).toBe(true);
        expect(entry.slug).not.toBe(slug);
        expect(entry.reason.trim().length).toBeGreaterThan(0);
        expect(seen.has(entry.slug)).toBe(false);
        seen.add(entry.slug);
      }
    }
  });

  it("pairs near-analogs on peptide pages", () => {
    expect(RELATED_PRODUCT_MAP["mt-2"]!.map((e) => e.slug)).toContain("pt-141");
    expect(RELATED_PRODUCT_MAP["pt-141"]!.map((e) => e.slug)).toContain("mt-2");
    expect(RELATED_PRODUCT_MAP["glp-3"]!.map((e) => e.slug)).toContain("glp-2");
    expect(RELATED_PRODUCT_MAP["glp-2"]!.map((e) => e.slug)).toContain("glp-3");
    expect(RELATED_PRODUCT_MAP["ss-31"]!.map((e) => e.slug)).toContain("mots-c");
    expect(RELATED_PRODUCT_MAP["mots-c"]!.map((e) => e.slug)).toContain("ss-31");
    expect(RELATED_PRODUCT_MAP["5-amino-1mq"]!.map((e) => e.slug)).toContain(
      "nad",
    );
    expect(RELATED_PRODUCT_MAP["nad"]!.map((e) => e.slug)).toContain(
      "5-amino-1mq",
    );
    expect(RELATED_PRODUCT_MAP["semax"]!.map((e) => e.slug)).toContain(
      "tesamorelin",
    );
    expect(RELATED_PRODUCT_MAP["tesamorelin"]!.map((e) => e.slug)).toContain(
      "semax",
    );
  });

  it("never cross-sells BAC Water or other supply diluents", () => {
    for (const entries of Object.values(RELATED_PRODUCT_MAP)) {
      expect(entries.map((entry) => entry.slug)).not.toContain("bac");
    }
    for (const product of products) {
      expect(
        getRelatedProducts(product.slug).map((item) => item.product.slug),
      ).not.toContain("bac");
      expect(
        getRelatedProducts(product.slug).every(
          (item) => item.product.category !== "Supply",
        ),
      ).toBe(true);
    }
  });
});

describe("getRelatedProducts", () => {
  it("resolves mapped slugs to products with reasons, in map order", () => {
    const related = getRelatedProducts("mt-2");
    expect(related.map((item) => item.product.slug)).toEqual(
      RELATED_PRODUCT_MAP["mt-2"]!.map((entry) => entry.slug),
    );
    expect(related[0]!.reason).toBe(RELATED_PRODUCT_MAP["mt-2"]![0]!.reason);
    expect(related[0]!.product.name).toBeTruthy();
  });

  it("returns an empty list for unknown slugs", () => {
    expect(getRelatedProducts("not-a-product")).toEqual([]);
  });
});
