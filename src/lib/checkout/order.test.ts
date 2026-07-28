import { describe, expect, it } from "vitest";
import { buildOrder } from "./order";

describe("buildOrder", () => {
  it("rejects a non-array or empty cart", () => {
    expect(buildOrder(null).ok).toBe(false);
    expect(buildOrder([]).ok).toBe(false);
  });

  it("rejects malformed items", () => {
    expect(buildOrder([{ slug: "glp-3" }]).ok).toBe(false);
  });

  it("rejects unknown products", () => {
    const result = buildOrder([{ slug: "nope", size: "15mg", qty: 1 }]);
    expect(result.ok).toBe(false);
  });

  it("rejects unknown sizes", () => {
    const result = buildOrder([{ slug: "glp-3", size: "999mg", qty: 1 }]);
    expect(result.ok).toBe(false);
  });

  it("rejects invalid quantities", () => {
    expect(buildOrder([{ slug: "glp-3", size: "15mg", qty: 0 }]).ok).toBe(false);
    expect(buildOrder([{ slug: "glp-3", size: "15mg", qty: 100 }]).ok).toBe(
      false,
    );
  });

  it("recomputes prices from the catalog and adds flat shipping", () => {
    const result = buildOrder([{ slug: "glp-3", size: "15mg", qty: 1 }]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.subtotal).toBe(99.99);
      expect(result.shipping).toBe(12);
      expect(result.total).toBeCloseTo(111.99, 2);
      expect(result.items[0].unitPrice).toBe(99.99);
    }
  });

  it("gives free shipping at or above the threshold", () => {
    const result = buildOrder([{ slug: "glp-3", size: "60mg", qty: 1 }]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.subtotal).toBe(239.99);
      expect(result.shipping).toBe(0);
      expect(result.total).toBe(239.99);
    }
  });
});
