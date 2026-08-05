import { describe, expect, it } from "vitest";
import {
  computeDiscount,
  normalizePromoCode,
  proportionallyDiscountedUnitPrices,
} from "./applyPromo";
import type { PromoCode } from "./types";

const percent20: PromoCode = {
  code: "SAVE20",
  percentOff: 20,
  active: true,
  firstOrderOnly: false,
  label: "20% off",
};

const tenOff: PromoCode = {
  code: "TENOFF",
  amountOff: 10,
  active: true,
  firstOrderOnly: false,
  label: "$10 off",
};

describe("normalizePromoCode", () => {
  it("trims and uppercases", () => {
    expect(normalizePromoCode("  save20 ")).toBe("SAVE20");
  });

  it("returns empty for blank input", () => {
    expect(normalizePromoCode("   ")).toBe("");
  });
});

describe("computeDiscount", () => {
  it("applies percent off and rounds to cents", () => {
    expect(computeDiscount(percent20, 99.99)).toBe(20);
  });

  it("applies fixed amount off", () => {
    expect(computeDiscount(tenOff, 50)).toBe(10);
  });

  it("caps discount at subtotal", () => {
    expect(computeDiscount(tenOff, 5)).toBe(5);
  });

  it("returns 0 for zero or negative subtotal", () => {
    expect(computeDiscount(percent20, 0)).toBe(0);
    expect(computeDiscount(percent20, -1)).toBe(0);
  });
});

describe("proportionallyDiscountedUnitPrices", () => {
  it("scales unit prices so line totals drop by the discount", () => {
    const items = [
      { unitPrice: 50, qty: 1 },
      { unitPrice: 50, qty: 1 },
    ];
    const scaled = proportionallyDiscountedUnitPrices(items, 20);
    expect(scaled[0]).toBe(40);
    expect(scaled[1]).toBe(40);
  });

  it("returns original prices when discount is 0", () => {
    expect(proportionallyDiscountedUnitPrices([{ unitPrice: 10, qty: 2 }], 0)).toEqual([
      10,
    ]);
  });
});
