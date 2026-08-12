import { describe, expect, it } from "vitest";
import { getProductBySlug } from "@/data/products";
import {
  allVariantsOutOfStock,
  getCartSuggestCandidates,
} from "./cartSuggest";
import type { ResolvedCartLine } from "./types";

function resolvedLine(slug: string, size: string): ResolvedCartLine {
  const product = getProductBySlug(slug)!;
  const variant = product.variants.find((item) => item.size === size)!;
  return {
    line: { slug, size, qty: 1 },
    product,
    variant,
    lineTotal: variant.price,
  };
}

describe("getCartSuggestCandidates", () => {
  it("suggests NAD+ when the cart has other products and no NAD+", () => {
    expect(getCartSuggestCandidates([resolvedLine("glp-3", "10mg")])).toEqual([
      "nad",
    ]);
  });

  it("suggests NAD+ when the cart has a blend and no NAD+", () => {
    expect(
      getCartSuggestCandidates([resolvedLine("wolverine-blend", "20mg")]),
    ).toEqual(["nad"]);
  });

  it("suggests GLOW then KLOW when NAD+ is already in the cart", () => {
    expect(getCartSuggestCandidates([resolvedLine("nad", "100mg")])).toEqual([
      "glow-blend",
      "klow-blend",
    ]);
  });

  it("skips blends already in the cart", () => {
    expect(
      getCartSuggestCandidates([
        resolvedLine("nad", "100mg"),
        resolvedLine("glow-blend", "70mg"),
      ]),
    ).toEqual(["klow-blend"]);
  });

  it("suggests nothing when NAD+ and both blends are already in the cart", () => {
    expect(
      getCartSuggestCandidates([
        resolvedLine("nad", "100mg"),
        resolvedLine("glow-blend", "70mg"),
        resolvedLine("klow-blend", "80mg"),
      ]),
    ).toEqual([]);
  });

  it("suggests nothing for an empty cart", () => {
    expect(getCartSuggestCandidates([])).toEqual([]);
  });
});

describe("allVariantsOutOfStock", () => {
  const nad = getProductBySlug("nad")!;

  it("is true when every variant qty is zero", () => {
    expect(
      allVariantsOutOfStock(nad.variants, {
        "NAD-100MG": 0,
        "NAD-500MG": 0,
        "NAD-1000MG": 0,
      }),
    ).toBe(true);
  });

  it("is false when any variant is in stock or inventory is unknown", () => {
    expect(
      allVariantsOutOfStock(nad.variants, {
        "NAD-100MG": 0,
        "NAD-500MG": 2,
        "NAD-1000MG": 0,
      }),
    ).toBe(false);
    expect(
      allVariantsOutOfStock(nad.variants, {
        "NAD-100MG": null,
        "NAD-500MG": 0,
        "NAD-1000MG": 0,
      }),
    ).toBe(false);
    expect(allVariantsOutOfStock(nad.variants, {})).toBe(false);
  });
});
