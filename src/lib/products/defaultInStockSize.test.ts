import { describe, expect, it } from "vitest";
import type { ProductVariant } from "@/data/products";
import {
  defaultInStockSize,
  resolveInStockSize,
} from "./defaultInStockSize";

const variants: ProductVariant[] = [
  { size: "10mg", price: 100, sku: "SKU-10", image: "/a.png" },
  { size: "15mg", price: 150, sku: "SKU-15", image: "/b.png" },
  { size: "30mg", price: 200, sku: "SKU-30", image: "/c.png" },
];

describe("defaultInStockSize", () => {
  it("returns the first variant size when availability is empty (inventory off)", () => {
    expect(defaultInStockSize(variants, {})).toBe("10mg");
  });

  it("returns the first variant when it is in stock", () => {
    expect(
      defaultInStockSize(variants, {
        "SKU-10": 3,
        "SKU-15": 0,
        "SKU-30": 5,
      }),
    ).toBe("10mg");
  });

  it("skips leading out-of-stock variants and selects the next in stock", () => {
    expect(
      defaultInStockSize(variants, {
        "SKU-10": 0,
        "SKU-15": 2,
        "SKU-30": 5,
      }),
    ).toBe("15mg");
  });

  it("skips multiple out-of-stock variants to reach a later in-stock size", () => {
    expect(
      defaultInStockSize(variants, {
        "SKU-10": 0,
        "SKU-15": 0,
        "SKU-30": 1,
      }),
    ).toBe("30mg");
  });

  it("treats null qty as in stock (inventory not configured for that SKU)", () => {
    expect(
      defaultInStockSize(variants, {
        "SKU-10": 0,
        "SKU-15": null,
        "SKU-30": 0,
      }),
    ).toBe("15mg");
  });

  it("falls back to the first variant when every size is out of stock", () => {
    expect(
      defaultInStockSize(variants, {
        "SKU-10": 0,
        "SKU-15": 0,
        "SKU-30": 0,
      }),
    ).toBe("10mg");
  });

  it("returns empty string when there are no variants", () => {
    expect(defaultInStockSize([], { "SKU-10": 5 })).toBe("");
  });
});

describe("resolveInStockSize", () => {
  it("keeps the selected size when it is still in stock", () => {
    expect(
      resolveInStockSize("15mg", variants, {
        "SKU-10": 0,
        "SKU-15": 2,
        "SKU-30": 0,
      }),
    ).toBe("15mg");
  });

  it("moves to the next in-stock size when the selection goes out of stock", () => {
    expect(
      resolveInStockSize("10mg", variants, {
        "SKU-10": 0,
        "SKU-15": 2,
        "SKU-30": 5,
      }),
    ).toBe("15mg");
  });
});
