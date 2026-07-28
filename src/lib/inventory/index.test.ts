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

  it("lists unique catalog variant SKUs", () => {
    const skus = catalogSkus();
    expect(skus.length).toBeGreaterThan(5);
    expect(skus).toContain("GLP-3-15MG");
    expect(new Set(skus).size).toBe(skus.length);
  });
});
