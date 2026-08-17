import { afterEach, describe, expect, it, vi } from "vitest";
import { getProductBySlug, getVariant } from "@/data/products";
import { snapshotCartItems } from "./snapshot";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("snapshotCartItems", () => {
  it("snapshots purchasable lines with current catalog prices", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.elevateprecisionhealth.com");
    const product = getProductBySlug("glp-3");
    const variant = getVariant(product!, "15mg");
    const { items, subtotal, droppedCount } = snapshotCartItems([
      { slug: "glp-3", size: "15mg", qty: 2 },
    ]);
    expect(droppedCount).toBe(0);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      slug: "glp-3",
      size: "15mg",
      sku: variant!.sku,
      name: "GLP-3",
      quantity: 2,
      unitPrice: variant!.price,
    });
    expect(items[0].imageUrl).toContain("/products/glp-3-15mg.png");
    expect(subtotal).toBe(variant!.price * 2);
  });

  it("drops unknown products and invalid quantities", () => {
    const { items, droppedCount } = snapshotCartItems([
      { slug: "does-not-exist", size: "15mg", qty: 1 },
      { slug: "glp-3", size: "15mg", qty: 0 },
    ]);
    expect(items).toEqual([]);
    expect(droppedCount).toBe(2);
  });
});
