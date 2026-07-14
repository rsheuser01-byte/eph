import { describe, expect, it } from "vitest";
import { buildOrder } from "./order";

describe("buildOrder", () => {
  it("rejects a non-array or empty cart", () => {
    expect(buildOrder(null).ok).toBe(false);
    expect(buildOrder([]).ok).toBe(false);
  });

  it("rejects malformed items", () => {
    expect(buildOrder([{ slug: "bp-3r" }]).ok).toBe(false);
  });

  it("rejects unknown products", () => {
    const result = buildOrder([{ slug: "nope", size: "20mg", qty: 1 }]);
    expect(result.ok).toBe(false);
  });

  it("rejects unknown sizes", () => {
    const result = buildOrder([{ slug: "bp-3r", size: "999mg", qty: 1 }]);
    expect(result.ok).toBe(false);
  });

  it("rejects invalid quantities", () => {
    expect(buildOrder([{ slug: "bp-3r", size: "20mg", qty: 0 }]).ok).toBe(false);
    expect(buildOrder([{ slug: "bp-3r", size: "20mg", qty: 100 }]).ok).toBe(
      false,
    );
  });

  it("recomputes prices from the catalog and adds flat shipping", () => {
    const result = buildOrder([{ slug: "bp-3r", size: "20mg", qty: 1 }]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.subtotal).toBe(69.99);
      expect(result.shipping).toBe(12);
      expect(result.total).toBeCloseTo(81.99, 2);
      expect(result.items[0].unitPrice).toBe(69.99);
    }
  });

  it("gives free shipping at or above the threshold", () => {
    const result = buildOrder([{ slug: "bp-3r", size: "50mg", qty: 1 }]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.subtotal).toBe(189.99);
      expect(result.shipping).toBe(0);
      expect(result.total).toBe(189.99);
    }
  });
});
