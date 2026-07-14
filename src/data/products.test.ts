import { describe, expect, it } from "vitest";
import {
  formatPrice,
  getProductBySlug,
  getVariant,
  productPriceRange,
  products,
} from "./products";

describe("catalog integrity", () => {
  it("has unique slugs", () => {
    const slugs = products.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every product at least one variant with a positive price", () => {
    for (const product of products) {
      expect(product.variants.length).toBeGreaterThan(0);
      for (const variant of product.variants) {
        expect(variant.price).toBeGreaterThan(0);
      }
    }
  });
});

describe("productPriceRange", () => {
  it("returns min and max across variants", () => {
    const product = getProductBySlug("bp-3r");
    expect(product).toBeDefined();
    const range = productPriceRange(product!);
    expect(range.min).toBe(69.99);
    expect(range.max).toBe(189.99);
  });
});

describe("formatPrice", () => {
  it("shows a single price when min equals max", () => {
    const product = getProductBySlug("mt-2");
    expect(formatPrice(product!)).toBe("$39.99");
  });

  it("shows a range when variants differ", () => {
    const product = getProductBySlug("bp-3r");
    expect(formatPrice(product!)).toBe("$69.99 – $189.99");
  });
});

describe("getVariant", () => {
  it("finds a variant by size", () => {
    const product = getProductBySlug("bp-3r");
    expect(getVariant(product!, "50mg")?.price).toBe(189.99);
  });

  it("returns undefined for an unknown size", () => {
    const product = getProductBySlug("bp-3r");
    expect(getVariant(product!, "999mg")).toBeUndefined();
  });
});
