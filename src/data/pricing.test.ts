import { describe, expect, it } from "vitest";
import { getProductBySlug, products } from "./products";
import {
  listPrice,
  pricingGuideEntries,
  unlistedPricingEntries,
} from "./pricing";

describe("pricing-guide.json", () => {
  it("has unique compound + size rows", () => {
    const keys = pricingGuideEntries.map(
      (row) => `${row.compound}::${row.size}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses positive list prices", () => {
    for (const row of pricingGuideEntries) {
      expect(row.listPrice).toBeGreaterThan(0);
    }
  });

  it("links every non-null productSlug to a live catalog size", () => {
    for (const row of pricingGuideEntries) {
      if (!row.productSlug) continue;
      const product = getProductBySlug(row.productSlug);
      expect(product, `missing product ${row.productSlug}`).toBeDefined();
      expect(
        product!.variants.some((variant) => variant.size === row.size),
        `${row.productSlug} missing size ${row.size}`,
      ).toBe(true);
    }
  });

  it("keeps catalog variant prices in sync with the guide", () => {
    for (const product of products) {
      for (const variant of product.variants) {
        const guided = pricingGuideEntries.find(
          (row) =>
            row.productSlug === product.slug && row.size === variant.size,
        );
        if (!guided) continue;
        expect(variant.price).toBe(guided.listPrice);
        expect(listPrice(product.slug, variant.size)).toBe(variant.price);
      }
    }
  });

  it("tracks unlisted compounds for future catalog work", () => {
    const compounds = unlistedPricingEntries().map((row) => row.compound);
    expect(compounds).toEqual(
      expect.arrayContaining([
        "BPC-157",
        "TB-500",
        "GHK-Cu",
        "KPV",
        "Ipamorelin",
        "CJC-1295 + Ipamorelin",
        "Semax",
        "Selank",
      ]),
    );
    expect(compounds).not.toContain("PT-141");
    expect(compounds).not.toContain("SS-31");
  });
});
