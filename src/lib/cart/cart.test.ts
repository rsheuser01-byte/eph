import { describe, expect, it } from "vitest";
import {
  addLine,
  cartCount,
  cartSubtotal,
  clampResolvedLinesToStock,
  MAX_QTY_PER_LINE,
  purchasableMaxQty,
  removeLine,
  resolveLines,
  sanitizeLines,
  updateQty,
} from "./cart";
import type { CartLine } from "./types";

describe("addLine", () => {
  it("adds a new line", () => {
    const result = addLine([], "glp-3", "15mg", 2);
    expect(result).toEqual([{ slug: "glp-3", size: "15mg", qty: 2 }]);
  });

  it("merges quantities for the same slug/size", () => {
    const start: CartLine[] = [{ slug: "glp-3", size: "15mg", qty: 1 }];
    const result = addLine(start, "glp-3", "15mg", 3);
    expect(result).toEqual([{ slug: "glp-3", size: "15mg", qty: 4 }]);
  });

  it("keeps different sizes as separate lines", () => {
    const start: CartLine[] = [{ slug: "glp-3", size: "15mg", qty: 1 }];
    const result = addLine(start, "glp-3", "60mg", 1);
    expect(result).toHaveLength(2);
  });

  it("clamps quantity to the maximum", () => {
    const result = addLine([], "glp-3", "15mg", 500);
    expect(result[0].qty).toBe(MAX_QTY_PER_LINE);
  });

  it("clamps merged quantity to available stock", () => {
    const start: CartLine[] = [{ slug: "glp-3", size: "15mg", qty: 2 }];
    const result = addLine(start, "glp-3", "15mg", 5, 3);
    expect(result).toEqual([{ slug: "glp-3", size: "15mg", qty: 3 }]);
  });

  it("does not mutate the input array", () => {
    const start: CartLine[] = [{ slug: "glp-3", size: "15mg", qty: 1 }];
    addLine(start, "glp-3", "15mg", 1);
    expect(start[0].qty).toBe(1);
  });
});

describe("purchasableMaxQty", () => {
  it("returns the global max when availability is unknown", () => {
    expect(purchasableMaxQty("SKU-1", null)).toBe(MAX_QTY_PER_LINE);
    expect(purchasableMaxQty("SKU-1", {})).toBe(MAX_QTY_PER_LINE);
  });

  it("returns the global max when inventory is not configured for the SKU", () => {
    expect(purchasableMaxQty("SKU-1", { "SKU-1": null })).toBe(MAX_QTY_PER_LINE);
  });

  it("returns on-hand stock when inventory is configured", () => {
    expect(purchasableMaxQty("SKU-1", { "SKU-1": 3 })).toBe(3);
  });

  it("returns 0 when the SKU is out of stock", () => {
    expect(purchasableMaxQty("SKU-1", { "SKU-1": 0 })).toBe(0);
  });
});

describe("updateQty", () => {
  it("updates an existing line quantity", () => {
    const start: CartLine[] = [{ slug: "glp-3", size: "15mg", qty: 1 }];
    expect(updateQty(start, "glp-3", "15mg", 5)).toEqual([
      { slug: "glp-3", size: "15mg", qty: 5 },
    ]);
  });

  it("clamps to available stock when a max is provided", () => {
    const start: CartLine[] = [{ slug: "glp-3", size: "15mg", qty: 1 }];
    expect(updateQty(start, "glp-3", "15mg", 8, 2)).toEqual([
      { slug: "glp-3", size: "15mg", qty: 2 },
    ]);
  });

  it("removes the line when quantity drops below 1", () => {
    const start: CartLine[] = [{ slug: "glp-3", size: "15mg", qty: 1 }];
    expect(updateQty(start, "glp-3", "15mg", 0)).toEqual([]);
  });

  it("removes the line when stock max is 0", () => {
    const start: CartLine[] = [{ slug: "glp-3", size: "15mg", qty: 2 }];
    expect(updateQty(start, "glp-3", "15mg", 2, 0)).toEqual([]);
  });
});

describe("clampResolvedLinesToStock", () => {
  it("reduces line qty that exceeds live stock", () => {
    const lines: CartLine[] = [{ slug: "glp-3", size: "15mg", qty: 5 }];
    const resolved = resolveLines(lines);
    const sku = resolved[0]!.variant.sku;
    const next = clampResolvedLinesToStock(lines, resolved, { [sku]: 2 });
    expect(next).toEqual([{ slug: "glp-3", size: "15mg", qty: 2 }]);
  });

  it("leaves qty alone when within stock", () => {
    const lines: CartLine[] = [{ slug: "glp-3", size: "15mg", qty: 2 }];
    const resolved = resolveLines(lines);
    const sku = resolved[0]!.variant.sku;
    const next = clampResolvedLinesToStock(lines, resolved, { [sku]: 5 });
    expect(next).toEqual(lines);
  });
});

describe("removeLine", () => {
  it("removes the matching line only", () => {
    const start: CartLine[] = [
      { slug: "glp-3", size: "15mg", qty: 1 },
      { slug: "mt-2", size: "10mg", qty: 1 },
    ];
    expect(removeLine(start, "glp-3", "15mg")).toEqual([
      { slug: "mt-2", size: "10mg", qty: 1 },
    ]);
  });
});

describe("cartSubtotal", () => {
  it("sums variant prices times quantity", () => {
    const lines: CartLine[] = [
      { slug: "glp-3", size: "15mg", qty: 2 }, // 99.99 x 2
      { slug: "mt-2", size: "10mg", qty: 1 }, // 44.99
    ];
    expect(cartSubtotal(lines)).toBeCloseTo(244.97, 2);
  });

  it("ignores unknown products", () => {
    const lines: CartLine[] = [{ slug: "does-not-exist", size: "1mg", qty: 1 }];
    expect(cartSubtotal(lines)).toBe(0);
  });
});

describe("sanitizeLines", () => {
  it("drops removed catalog products and unknown sizes", () => {
    const lines: CartLine[] = [
      { slug: "bac", size: "10ml", qty: 1 },
      { slug: "glp-3", size: "10mg", qty: 2 },
      { slug: "glp-3", size: "999mg", qty: 1 },
    ];
    expect(sanitizeLines(lines)).toEqual([
      { slug: "glp-3", size: "10mg", qty: 2 },
    ]);
  });
});

describe("cartCount", () => {
  it("sums quantities across lines", () => {
    const lines: CartLine[] = [
      { slug: "glp-3", size: "15mg", qty: 2 },
      { slug: "mt-2", size: "10mg", qty: 3 },
    ];
    expect(cartCount(lines)).toBe(5);
  });

  it("ignores unknown products", () => {
    const lines: CartLine[] = [
      { slug: "bac", size: "10ml", qty: 4 },
      { slug: "glp-3", size: "10mg", qty: 1 },
    ];
    expect(cartCount(lines)).toBe(1);
  });
});
