export const FREE_SHIPPING_THRESHOLD = 150;
export const FLAT_SHIPPING = 12;

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) {
    return 0;
  }
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function orderTotals(
  subtotal: number,
  tax = 0,
  discount = 0,
): {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
} {
  const shipping = shippingFor(subtotal);
  const taxAmount = roundMoney(tax);
  const discountAmount = Math.min(roundMoney(Math.max(0, discount)), roundMoney(subtotal));
  return {
    subtotal,
    shipping,
    tax: taxAmount,
    discount: discountAmount,
    total: roundMoney(subtotal - discountAmount + shipping + taxAmount),
  };
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
