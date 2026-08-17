import { describe, expect, it } from "vitest";
import { getProductBySlug, getVariant } from "@/data/products";
import { restoreCartLines } from "./restore";
import type { SavedCartItem } from "./types";

function item(overrides: Partial<SavedCartItem> = {}): SavedCartItem {
  const product = getProductBySlug("glp-3")!;
  const variant = getVariant(product, "15mg")!;
  return {
    slug: "glp-3",
    size: "15mg",
    sku: variant.sku,
    name: product.name,
    quantity: 2,
    unitPrice: 1.11,
    imageUrl: "https://example.com/stale.png",
    ...overrides,
  };
}

describe("restoreCartLines", () => {
  it("rebuilds lines without trusting saved prices", () => {
    const { lines, droppedCount } = restoreCartLines([item()]);
    expect(droppedCount).toBe(0);
    expect(lines).toEqual([{ slug: "glp-3", size: "15mg", qty: 2 }]);
    const variant = getVariant(getProductBySlug("glp-3")!, "15mg")!;
    expect(variant.price).not.toBe(1.11);
  });

  it("drops discontinued or unknown products", () => {
    const { lines, droppedCount } = restoreCartLines([
      item({ slug: "retired-peptide", size: "15mg" }),
      item(),
    ]);
    expect(droppedCount).toBe(1);
    expect(lines).toEqual([{ slug: "glp-3", size: "15mg", qty: 2 }]);
  });
});
