import { afterEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { createStripeTaxProvider } from "./stripe";
import { stripeProductTaxCode } from "./stripeTaxCode";
import type { TaxQuoteInput } from "./types";

const sampleInput: TaxQuoteInput = {
  customer: {
    country: "US",
    state: "KY",
    city: "Louisville",
    zip: "40202",
    address1: "1 Main St",
  },
  items: [{ sku: "SKU1", quantity: 1, unitPrice: 100 }],
  shipping: 12,
};

describe("stripeProductTaxCode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts Stripe txcd_ codes and ignores TaxJar-style codes", () => {
    expect(stripeProductTaxCode("txcd_99999999")).toBe("txcd_99999999");
    expect(stripeProductTaxCode("20010")).toBeUndefined();
    expect(stripeProductTaxCode("")).toBeUndefined();
  });
});

describe("stripe tax provider", () => {
  it("maps tax_amount_exclusive into a TaxQuote", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "taxcalc_1",
      tax_amount_exclusive: 612,
    });
    const provider = createStripeTaxProvider({
      getClient: () =>
        ({
          tax: { calculations: { create } },
        }) as unknown as Stripe,
    });

    const quote = await provider.quote(sampleInput);
    expect(quote).toEqual({
      amount: 6.12,
      provider: "stripe",
      quoteId: "taxcalc_1",
      jurisdiction: "Louisville, KY, US",
    });
    expect(create).toHaveBeenCalledOnce();
    const params = create.mock.calls[0]?.[0] as {
      customer_details: { address_source: string };
      shipping_cost: { amount: number };
      line_items: Array<{ amount: number; quantity: number }>;
    };
    expect(params.customer_details.address_source).toBe("shipping");
    expect(params.shipping_cost.amount).toBe(1200);
    expect(params.line_items[0]).toMatchObject({
      amount: 10000,
      quantity: 1,
    });
  });

  it("throws a safe error when Stripe Tax fails", async () => {
    const provider = createStripeTaxProvider({
      getClient: () =>
        ({
          tax: {
            calculations: {
              create: vi.fn().mockRejectedValue(new Error("unauthorized")),
            },
          },
        }) as unknown as Stripe,
    });
    await expect(provider.quote(sampleInput)).rejects.toThrow(
      /tax calculation unavailable/i,
    );
  });
});
