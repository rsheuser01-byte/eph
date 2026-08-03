import { describe, expect, it } from "vitest";
import { getProductBySlug } from "@/data/products";
import {
  allVariantsOutOfStock,
  shouldSuggestBac,
} from "./cartSuggest";
import type { ResolvedCartLine } from "./types";

function resolvedLine(
  slug: string,
  size: string,
): ResolvedCartLine {
  const product = getProductBySlug(slug)!;
  const variant = product.variants.find((item) => item.size === size)!;
  return {
    line: { slug, size, qty: 1 },
    product,
    variant,
    lineTotal: variant.price,
  };
}

describe("shouldSuggestBac", () => {
  it("suggests BAC when the cart has a peptide and no BAC", () => {
    expect(shouldSuggestBac([resolvedLine("glp-3", "10mg")])).toBe(true);
  });

  it("suggests BAC when the cart has a coenzyme and no BAC", () => {
    expect(shouldSuggestBac([resolvedLine("nad", "100mg")])).toBe(true);
  });

  it("suggests BAC when the cart has a blend and no BAC", () => {
    expect(shouldSuggestBac([resolvedLine("wolverine-blend", "20mg")])).toBe(
      true,
    );
  });

  it("does not suggest BAC when BAC is already in the cart", () => {
    expect(
      shouldSuggestBac([
        resolvedLine("glp-3", "10mg"),
        resolvedLine("bac", "10ml"),
      ]),
    ).toBe(false);
  });

  it("does not suggest BAC for an empty cart", () => {
    expect(shouldSuggestBac([])).toBe(false);
  });

  it("does not suggest BAC when the cart is only BAC", () => {
    expect(shouldSuggestBac([resolvedLine("bac", "30ml")])).toBe(false);
  });
});

describe("allVariantsOutOfStock", () => {
  const bac = getProductBySlug("bac")!;

  it("is true when every variant qty is zero", () => {
    expect(
      allVariantsOutOfStock(bac.variants, {
        "BAC-10ML": 0,
        "BAC-30ML": 0,
      }),
    ).toBe(true);
  });

  it("is false when any variant is in stock or inventory is unknown", () => {
    expect(
      allVariantsOutOfStock(bac.variants, {
        "BAC-10ML": 0,
        "BAC-30ML": 2,
      }),
    ).toBe(false);
    expect(
      allVariantsOutOfStock(bac.variants, {
        "BAC-10ML": null,
        "BAC-30ML": 0,
      }),
    ).toBe(false);
    expect(allVariantsOutOfStock(bac.variants, {})).toBe(false);
  });
});
