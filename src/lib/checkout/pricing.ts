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
): {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
} {
  const shipping = shippingFor(subtotal);
  const taxAmount = roundMoney(tax);
  return {
    subtotal,
    shipping,
    tax: taxAmount,
    total: roundMoney(subtotal + shipping + taxAmount),
  };
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
