import { isProductionRuntime } from "@/lib/config/productionReadiness";
import { createMockTaxProvider } from "./mock";
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
      if (isProductionRuntime()) {
        throw new TaxCalculationError();
      }
      return createMockTaxProvider();
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
