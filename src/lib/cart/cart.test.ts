import { describe, expect, it } from "vitest";
import {
  addLine,
  cartCount,
  cartSubtotal,
  MAX_QTY_PER_LINE,
  removeLine,
  updateQty,
} from "./cart";
import type { CartLine } from "./types";

describe("addLine", () => {
  it("adds a new line", () => {
    const result = addLine([], "bp-3r", "20mg", 2);
    expect(result).toEqual([{ slug: "bp-3r", size: "20mg", qty: 2 }]);
  });

  it("merges quantities for the same slug/size", () => {
    const start: CartLine[] = [{ slug: "bp-3r", size: "20mg", qty: 1 }];
    const result = addLine(start, "bp-3r", "20mg", 3);
    expect(result).toEqual([{ slug: "bp-3r", size: "20mg", qty: 4 }]);
  });

  it("keeps different sizes as separate lines", () => {
    const start: CartLine[] = [{ slug: "bp-3r", size: "20mg", qty: 1 }];
    const result = addLine(start, "bp-3r", "50mg", 1);
    expect(result).toHaveLength(2);
  });

  it("clamps quantity to the maximum", () => {
    const result = addLine([], "bp-3r", "20mg", 500);
    expect(result[0].qty).toBe(MAX_QTY_PER_LINE);
  });

  it("does not mutate the input array", () => {
    const start: CartLine[] = [{ slug: "bp-3r", size: "20mg", qty: 1 }];
    addLine(start, "bp-3r", "20mg", 1);
    expect(start[0].qty).toBe(1);
  });
});

describe("updateQty", () => {
  it("updates an existing line quantity", () => {
    const start: CartLine[] = [{ slug: "bp-3r", size: "20mg", qty: 1 }];
    expect(updateQty(start, "bp-3r", "20mg", 5)).toEqual([
      { slug: "bp-3r", size: "20mg", qty: 5 },
    ]);
  });

  it("removes the line when quantity drops below 1", () => {
    const start: CartLine[] = [{ slug: "bp-3r", size: "20mg", qty: 1 }];
    expect(updateQty(start, "bp-3r", "20mg", 0)).toEqual([]);
  });
});

describe("removeLine", () => {
  it("removes the matching line only", () => {
    const start: CartLine[] = [
      { slug: "bp-3r", size: "20mg", qty: 1 },
      { slug: "mt-2", size: "10mg", qty: 1 },
    ];
    expect(removeLine(start, "bp-3r", "20mg")).toEqual([
      { slug: "mt-2", size: "10mg", qty: 1 },
    ]);
  });
});

describe("cartSubtotal", () => {
  it("sums variant prices times quantity", () => {
    const lines: CartLine[] = [
      { slug: "bp-3r", size: "20mg", qty: 2 }, // 69.99 x 2
      { slug: "mt-2", size: "10mg", qty: 1 }, // 39.99
    ];
    expect(cartSubtotal(lines)).toBeCloseTo(179.97, 2);
  });

  it("ignores unknown products", () => {
    const lines: CartLine[] = [{ slug: "does-not-exist", size: "1mg", qty: 1 }];
    expect(cartSubtotal(lines)).toBe(0);
  });
});

describe("cartCount", () => {
  it("sums quantities across lines", () => {
    const lines: CartLine[] = [
      { slug: "bp-3r", size: "20mg", qty: 2 },
      { slug: "mt-2", size: "10mg", qty: 3 },
    ];
    expect(cartCount(lines)).toBe(5);
  });
});
