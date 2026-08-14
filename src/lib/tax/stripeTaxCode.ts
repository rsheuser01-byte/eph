/** Only pass through real Stripe tax codes; never invent a txcd_ value. */
export function stripeProductTaxCode(
  raw = process.env.TAX_PRODUCT_TAX_CODE,
): string | undefined {
  const code = raw?.trim() ?? "";
  return code.startsWith("txcd_") ? code : undefined;
}
