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
    expect(totals).toEqual({
      subtotal: 50,
      shipping: FLAT_SHIPPING,
      tax: 0,
      discount: 0,
      total: 62,
    });
  });

  it("includes tax in the charged total", () => {
    const totals = orderTotals(50, 3.5);
    expect(totals.tax).toBe(3.5);
    expect(totals.total).toBe(65.5);
  });

  it("keeps totals equal to subtotal when shipping is free", () => {
    const totals = orderTotals(200);
    expect(totals.total).toBe(200);
  });

  it("subtracts discount from the charged total without changing shipping", () => {
    const totals = orderTotals(50, 0, 10);
    expect(totals.discount).toBe(10);
    expect(totals.shipping).toBe(FLAT_SHIPPING);
    expect(totals.total).toBe(52);
  });

  it("still grants free shipping from the pre-discount subtotal", () => {
    const totals = orderTotals(FREE_SHIPPING_THRESHOLD, 0, 50);
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(FREE_SHIPPING_THRESHOLD - 50);
  });
});
