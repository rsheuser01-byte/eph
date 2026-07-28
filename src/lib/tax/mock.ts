import type { TaxProvider, TaxQuote, TaxQuoteInput } from "./types";
import { roundMoney } from "./types";

/** Local/dev provider — always $0. Must not be used in production. */
export function createMockTaxProvider(): TaxProvider {
  return {
    name: "mock",
    async quote(_input: TaxQuoteInput): Promise<TaxQuote> {
      return {
        amount: roundMoney(0),
        provider: "mock",
      };
    },
  };
}
