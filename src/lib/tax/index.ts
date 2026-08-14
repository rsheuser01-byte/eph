import { createMockTaxProvider } from "./mock";
import { createStripeTaxProvider } from "./stripe";
import { createTaxJarProvider } from "./taxjar";
import {
  TaxCalculationError,
  type TaxProvider,
  type TaxQuote,
  type TaxQuoteInput,
} from "./types";

export type {
  TaxProvider,
  TaxQuote,
  TaxQuoteInput,
} from "./types";
export { TaxCalculationError, roundMoney } from "./types";

export function getTaxProvider(): TaxProvider {
  const name = (process.env.TAX_PROVIDER ?? "mock").toLowerCase().trim();
  switch (name) {
    case "mock":
      return createMockTaxProvider();
    case "stripe":
      return createStripeTaxProvider();
    case "taxjar":
      return createTaxJarProvider();
    default:
      throw new TaxCalculationError();
  }
}

/** Quote sales tax for a cart + destination. Never trusts client-supplied tax. */
export async function quoteTax(input: TaxQuoteInput): Promise<TaxQuote> {
  return getTaxProvider().quote(input);
}
