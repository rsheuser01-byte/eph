export const FREE_SHIPPING_THRESHOLD = 150;
export const FLAT_SHIPPING = 12;

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) {
    return 0;
  }
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
}

export function orderTotals(subtotal: number): {
  subtotal: number;
  shipping: number;
  total: number;
} {
  const shipping = shippingFor(subtotal);
  return { subtotal, shipping, total: subtotal + shipping };
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}
