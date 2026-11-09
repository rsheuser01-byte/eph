import { describe, expect, it } from "vitest";
import { computeDiscount } from "@/lib/promo/applyPromo";
import { orderTotals } from "./pricing";
import type { PromoCode } from "@/lib/promo/types";
import {
  BOGO_LABEL,
  applyBogoToItems,
  bogoFreeQty,
  bogoShipQty,
  formatPaidFreeQty,
  isBogoEnabled,
  orderItemShipQty,
  paidQtyCapacity,
  parseBogoEnabledFlag,
} from "./bogo";

const percent20: PromoCode = {
  code: "SAVE20",
  percentOff: 20,
  active: true,
  firstOrderOnly: false,
  label: "20% off",
};

const tenOff: PromoCode = {
  code: "TENOFF",
  amountOff: 10,
  active: true,
  firstOrderOnly: false,
  label: "$10 off",
};

describe("isBogoEnabled / parseBogoEnabledFlag", () => {
  it("defaults to ON when unset or blank", () => {
    expect(parseBogoEnabledFlag(undefined)).toBe(true);
    expect(parseBogoEnabledFlag("")).toBe(true);
    expect(parseBogoEnabledFlag("   ")).toBe(true);
    expect(isBogoEnabled(undefined)).toBe(true);
  });

  it("treats 0/false/off/no as off (case-insensitive)", () => {
    expect(parseBogoEnabledFlag("0")).toBe(false);
    expect(parseBogoEnabledFlag("false")).toBe(false);
    expect(parseBogoEnabledFlag("OFF")).toBe(false);
    expect(parseBogoEnabledFlag("No")).toBe(false);
  });

  it("treats other values as on", () => {
    expect(parseBogoEnabledFlag("1")).toBe(true);
    expect(parseBogoEnabledFlag("true")).toBe(true);
    expect(parseBogoEnabledFlag("on")).toBe(true);
  });
});

describe("bogoFreeQty / bogoShipQty", () => {
  it("gives one free unit per paid unit for qty 1, 2, and 3", () => {
    expect(bogoFreeQty(1, true)).toBe(1);
    expect(bogoShipQty(1, true)).toBe(2);

    expect(bogoFreeQty(2, true)).toBe(2);
    expect(bogoShipQty(2, true)).toBe(4);

    expect(bogoFreeQty(3, true)).toBe(3);
    expect(bogoShipQty(3, true)).toBe(6);
  });

  it("does not add free units when the switch is off", () => {
    expect(bogoFreeQty(1, false)).toBe(0);
    expect(bogoShipQty(3, false)).toBe(3);
  });

  it("ignores non-positive quantities", () => {
    expect(bogoFreeQty(0, true)).toBe(0);
    expect(bogoFreeQty(-2, true)).toBe(0);
  });
});

describe("applyBogoToItems", () => {
  const lineA = {
    sku: "GLP-3-15MG",
    name: "GLP-3",
    size: "15mg",
    qty: 1,
    unitPrice: 99.99,
  };
  const lineB = {
    sku: "GLP-3-60MG",
    name: "GLP-3",
    size: "60mg",
    qty: 2,
    unitPrice: 239.99,
  };
  const lineC = {
    sku: "NAD-100MG",
    name: "NAD+",
    size: "100mg",
    qty: 3,
    unitPrice: 39.99,
  };

  it("applies free units per line without changing paid qty or unit price", () => {
    const items = applyBogoToItems([lineA, lineB, lineC], true);
    expect(items.map((item) => item.qty)).toEqual([1, 2, 3]);
    expect(items.map((item) => item.freeQty)).toEqual([1, 2, 3]);
    expect(items.map((item) => item.unitPrice)).toEqual([
      99.99, 239.99, 39.99,
    ]);
  });

  it("does not combine different products or variants", () => {
    const items = applyBogoToItems(
      [
        { ...lineA, qty: 1 },
        { ...lineB, qty: 1 },
      ],
      true,
    );
    expect(items[0]?.freeQty).toBe(1);
    expect(items[1]?.freeQty).toBe(1);
    expect(orderItemShipQty(items[0]!)).toBe(2);
    expect(orderItemShipQty(items[1]!)).toBe(2);
  });

  it("leaves freeQty at 0 when the switch is off", () => {
    const items = applyBogoToItems([lineA], false);
    expect(items[0]?.freeQty).toBe(0);
    expect(items[0]?.qty).toBe(1);
  });
});

describe("paidQtyCapacity (stock limits)", () => {
  it("halves physical stock when BOGO is on", () => {
    expect(paidQtyCapacity(1, true)).toBe(0);
    expect(paidQtyCapacity(2, true)).toBe(1);
    expect(paidQtyCapacity(3, true)).toBe(1);
    expect(paidQtyCapacity(4, true)).toBe(2);
  });

  it("uses physical stock 1:1 when BOGO is off", () => {
    expect(paidQtyCapacity(1, false)).toBe(1);
    expect(paidQtyCapacity(3, false)).toBe(3);
  });

  it("returns null when inventory is not configured", () => {
    expect(paidQtyCapacity(null, true)).toBeNull();
    expect(paidQtyCapacity(undefined, true)).toBeNull();
  });
});

describe("promo codes stack on the paid subtotal", () => {
  it("applies percent-off to paid qty only (free units are not charged)", () => {
    const paidSubtotal = 99.99 * 2;
    expect(bogoFreeQty(2, true)).toBe(2);
    expect(computeDiscount(percent20, paidSubtotal)).toBe(40);
    const totals = orderTotals(paidSubtotal, 0, 40);
    expect(totals.discount).toBe(40);
    expect(totals.subtotal).toBe(paidSubtotal);
    expect(totals.total).toBe(paidSubtotal - 40 + totals.shipping);
  });

  it("applies a fixed amount off the paid subtotal alongside BOGO", () => {
    const paidSubtotal = 50;
    expect(computeDiscount(tenOff, paidSubtotal)).toBe(10);
    const totals = orderTotals(paidSubtotal, 0, 10);
    expect(totals.discount).toBe(10);
    expect(totals.total).toBe(50 - 10 + totals.shipping);
  });

  it("does not reduce the charged price for BOGO itself", () => {
    const paidSubtotal = 80;
    const totals = orderTotals(paidSubtotal);
    expect(totals.discount).toBe(0);
    expect(totals.subtotal).toBe(80);
  });
});

describe("formatPaidFreeQty", () => {
  it("shows paid + free for packing and receipts", () => {
    expect(formatPaidFreeQty(1, 1)).toBe("1 + 1 free");
    expect(formatPaidFreeQty(3, 3)).toBe("3 + 3 free");
    expect(formatPaidFreeQty(2, 0)).toBe("2");
  });

  it("keeps the promotion label stable", () => {
    expect(BOGO_LABEL).toBe("Buy One Get One Free");
  });
});
