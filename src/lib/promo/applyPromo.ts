import { roundMoney } from "@/lib/checkout/pricing";
import type { PromoCode } from "./types";

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function computeDiscount(promo: PromoCode, subtotal: number): number {
  if (subtotal <= 0) {
    return 0;
  }
  let discount = 0;
  if (typeof promo.percentOff === "number") {
    discount = roundMoney((subtotal * promo.percentOff) / 100);
  } else if (typeof promo.amountOff === "number") {
    discount = roundMoney(promo.amountOff);
  }
  return Math.min(discount, roundMoney(subtotal));
}

/**
 * Scale line unit prices so TaxJar sees the discounted merchandise total.
 * Uses a uniform ratio across lines.
 */
export function proportionallyDiscountedUnitPrices(
  items: Array<{ unitPrice: number; qty: number }>,
  discount: number,
): number[] {
  if (discount <= 0) {
    return items.map((item) => item.unitPrice);
  }
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0,
  );
  if (subtotal <= 0) {
    return items.map((item) => item.unitPrice);
  }
  const ratio = 1 - Math.min(discount, subtotal) / subtotal;
  return items.map((item) => roundMoney(item.unitPrice * ratio));
}
