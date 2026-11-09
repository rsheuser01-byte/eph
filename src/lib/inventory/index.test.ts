import { describe, expect, it } from "vitest";
import { catalogSkus, stockItemsFromOrder } from "./index";

describe("inventory helpers", () => {
  it("maps order lines to stock items", () => {
    expect(
      stockItemsFromOrder([
        { sku: "A", name: "A", size: "1", qty: 2, unitPrice: 1 },
        { sku: "B", name: "B", size: "1", qty: 1, unitPrice: 1 },
      ]),
    ).toEqual([
      { sku: "A", qty: 2 },
      { sku: "B", qty: 1 },
    ]);
  });

  it("includes BOGO free units in the reserved/decremented quantity", () => {
    expect(
      stockItemsFromOrder([
        { sku: "A", name: "A", size: "1", qty: 1, freeQty: 1, unitPrice: 1 },
        { sku: "B", name: "B", size: "1", qty: 3, freeQty: 3, unitPrice: 1 },
      ]),
    ).toEqual([
      { sku: "A", qty: 2 },
      { sku: "B", qty: 6 },
    ]);
  });

  it("lists unique catalog variant SKUs", () => {
    const skus = catalogSkus();
    expect(skus.length).toBeGreaterThan(5);
    expect(skus).toContain("GLP-3-15MG");
    expect(new Set(skus).size).toBe(skus.length);
  });
});
