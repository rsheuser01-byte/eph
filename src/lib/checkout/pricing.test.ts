import { describe, expect, it } from "vitest";
import {
  FLAT_SHIPPING,
  FREE_SHIPPING_THRESHOLD,
  orderTotals,
  shippingFor,
} from "./pricing";

describe("shippingFor", () => {
  it("is free for an empty subtotal", () => {
    expect(shippingFor(0)).toBe(0);
  });

  it("charges the flat rate below the threshold", () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD - 0.01)).toBe(FLAT_SHIPPING);
  });

  it("is free at or above the threshold", () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD)).toBe(0);
    expect(shippingFor(FREE_SHIPPING_THRESHOLD + 10)).toBe(0);
  });
});

describe("orderTotals", () => {
  it("adds shipping to the subtotal", () => {
    const totals = orderTotals(50);
    expect(totals).toEqual({ subtotal: 50, shipping: FLAT_SHIPPING, total: 62 });
  });

  it("keeps totals equal to subtotal when shipping is free", () => {
    const totals = orderTotals(200);
    expect(totals.total).toBe(200);
  });
});
