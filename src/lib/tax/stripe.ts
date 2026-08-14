import type Stripe from "stripe";
import { createStripeClient } from "@/lib/payments/stripe";
import { toCents } from "@/lib/payments/money";
import { stripeProductTaxCode } from "./stripeTaxCode";
import {
  TaxCalculationError,
  roundMoney,
  type TaxProvider,
  type TaxQuote,
  type TaxQuoteInput,
} from "./types";

export type StripeTaxProviderDeps = {
  getClient?: () => Stripe;
};

function fromCents(cents: number): number {
  return roundMoney(cents / 100);
}

export function createStripeTaxProvider(
  deps: StripeTaxProviderDeps = {},
): TaxProvider {
  const getClient = deps.getClient ?? createStripeClient;

  return {
    name: "stripe",
    async quote(input: TaxQuoteInput): Promise<TaxQuote> {
      let calculation: Stripe.Tax.Calculation;
      try {
        calculation = await getClient().tax.calculations.create({
          currency: "usd",
          customer_details: {
            address: {
              line1: input.customer.address1,
              city: input.customer.city,
              state: input.customer.state,
              postal_code: input.customer.zip,
              country: input.customer.country || "US",
            },
            address_source: "shipping",
          },
          line_items: input.items.map((item, index) => {
            const taxCode = item.taxCode?.startsWith("txcd_")
              ? item.taxCode
              : stripeProductTaxCode();
            return {
              amount: toCents(item.unitPrice),
              quantity: item.quantity,
              reference: item.sku || String(index + 1),
              ...(taxCode ? { tax_code: taxCode } : {}),
            };
          }),
          shipping_cost:
            input.shipping > 0
              ? { amount: toCents(input.shipping) }
              : undefined,
        });
      } catch (error) {
        console.error("[tax] Stripe Tax calculation failed", error);
        throw new TaxCalculationError();
      }

      const taxCents = calculation.tax_amount_exclusive;
      if (typeof taxCents !== "number" || !Number.isFinite(taxCents)) {
        console.error("[tax] Stripe Tax response missing tax_amount_exclusive");
        throw new TaxCalculationError();
      }

      const jurisdiction = [
        input.customer.city,
        input.customer.state,
        input.customer.country || "US",
      ]
        .filter(Boolean)
        .join(", ");

      return {
        amount: fromCents(taxCents),
        provider: "stripe",
        quoteId: calculation.id ?? undefined,
        jurisdiction,
      };
    },
  };
}
