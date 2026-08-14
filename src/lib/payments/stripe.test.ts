import { afterEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import {
  STRIPE_CHECKOUT_INTEGRATION_ID,
  createStripeProvider,
  verifyStripeCheckout,
} from "./stripe";
import type { ChargeInput } from "./types";

function chargeInput(overrides: Partial<ChargeInput> = {}): ChargeInput {
  return {
    orderId: "EPH-1",
    amount: 19.99,
    currency: "USD",
    billing: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      address1: "1 Lab St",
      city: "Louisville",
      state: "KY",
      zip: "40202",
      country: "US",
    },
    items: [
      {
        sku: "SKU1",
        name: "GLP-3",
        size: "10mg",
        qty: 1,
        unitPrice: 19.99,
      },
    ],
    lookupToken: "tok_1",
    ...overrides,
  };
}

describe("createStripeProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates a hosted Checkout Session and returns a redirect", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://shop.example.com");
    const create = vi.fn().mockResolvedValue({
      id: "cs_test_1",
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
    });
    const provider = createStripeProvider({
      getClient: () =>
        ({
          checkout: { sessions: { create } },
        }) as unknown as Stripe,
      now: () => Date.parse("2026-08-14T12:00:00.000Z"),
    });

    const outcome = await provider.beginCheckout(chargeInput());

    expect(outcome).toEqual({
      kind: "redirect",
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
      transactionId: "cs_test_1",
    });
    expect(create).toHaveBeenCalledTimes(1);
    const params = create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(params.mode).toBe("payment");
    expect(params.integration_identifier).toBe(STRIPE_CHECKOUT_INTEGRATION_ID);
    expect(params.client_reference_id).toBe("EPH-1");
    expect(params.payment_method_types).toBeUndefined();
    expect(params.automatic_tax).toBeUndefined();
    expect(params.success_url).toContain("/checkout/success?order=EPH-1");
    expect(params.cancel_url).toBe(
      "https://shop.example.com/checkout?error=payment_cancelled",
    );
    const lineItems = params.line_items as Array<{
      price_data: { unit_amount: number; currency: string };
    }>;
    expect(lineItems[0]?.price_data.unit_amount).toBe(1999);
    expect(lineItems[0]?.price_data.currency).toBe("usd");
  });

  it("refunds via PaymentIntent id", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "re_1",
      status: "succeeded",
    });
    const provider = createStripeProvider({
      getClient: () =>
        ({
          refunds: { create },
        }) as unknown as Stripe,
    });

    const outcome = await provider.refund!({
      orderId: "EPH-1",
      transactionId: "pi_test_1",
      amount: 19.99,
      currency: "USD",
    });

    expect(outcome.ok).toBe(true);
    expect(create).toHaveBeenCalledWith({
      payment_intent: "pi_test_1",
      amount: 1999,
    });
  });
});

describe("verifyStripeCheckout", () => {
  it("treats a paid session as approved", async () => {
    const result = await verifyStripeCheckout({
      orderId: "EPH-1",
      transactionId: "cs_test_1",
      getClient: () =>
        ({
          checkout: {
            sessions: {
              retrieve: vi.fn().mockResolvedValue({
                id: "cs_test_1",
                client_reference_id: "EPH-1",
                payment_status: "paid",
                status: "complete",
                amount_total: 1999,
                currency: "usd",
              }),
            },
          },
        }) as unknown as Stripe,
    });
    expect(result).toMatchObject({
      verified: true,
      status: "approved",
      amountCents: 1999,
      currency: "USD",
    });
  });

  it("skips expiration while the session is still open", async () => {
    const result = await verifyStripeCheckout({
      orderId: "EPH-1",
      transactionId: "cs_test_1",
      getClient: () =>
        ({
          checkout: {
            sessions: {
              retrieve: vi.fn().mockResolvedValue({
                id: "cs_test_1",
                client_reference_id: "EPH-1",
                payment_status: "unpaid",
                status: "open",
                amount_total: 1999,
                currency: "usd",
              }),
            },
          },
        }) as unknown as Stripe,
    });
    expect(result.skipExpire).toBe(true);
    expect(result.status).toBe("pending");
  });
});
