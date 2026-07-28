export type TaxQuoteInput = {
  orderId?: string;
  customer: {
    country: string;
    state: string;
    city: string;
    zip: string;
    address1: string;
  };
  items: Array<{
    sku: string;
    quantity: number;
    unitPrice: number;
    taxCode?: string;
  }>;
  shipping: number;
};

export type TaxQuote = {
  /** Tax amount in dollars (2 decimal places). */
  amount: number;
  provider: string;
  quoteId?: string;
  /** Human-readable jurisdiction summary when available. */
  jurisdiction?: string;
};

export interface TaxProvider {
  readonly name: string;
  quote(input: TaxQuoteInput): Promise<TaxQuote>;
}

export class TaxCalculationError extends Error {
  constructor(message = "Tax calculation unavailable. Please try again.") {
    super(message);
    this.name = "TaxCalculationError";
  }
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}
