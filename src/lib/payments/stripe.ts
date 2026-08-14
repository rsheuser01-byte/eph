import Stripe from "stripe";
import { toCents } from "./money";
import { stripeProductTaxCode } from "@/lib/tax/stripeTaxCode";
import type {
  ChargeInput,
  CheckoutOutcome,
  PaymentProvider,
  PaymentVerification,
  RefundInput,
  RefundOutcome,
} from "./types";

export const STRIPE_API_VERSION = "2026-07-29.dahlia" as const;

/** Dashboard label for this hosted Checkout flow. Suffix is 8 letters. */
export const STRIPE_CHECKOUT_INTEGRATION_ID = "eph-hosted-kqmtrwvx";

const STRIPE_SESSION_MIN_MINUTES = 30;
const STRIPE_SESSION_MAX_MINUTES = 24 * 60;

export function createStripeClient(
  secretKey = process.env.STRIPE_SECRET_KEY,
): Stripe {
  const key = secretKey?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}

function siteBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) {
    return explicit;
  }
  throw new Error(
    "NEXT_PUBLIC_SITE_URL is required for Stripe Checkout return URLs.",
  );
}

function sessionExpiresAtUnix(now = Date.now()): number {
  const raw = process.env.CHECKOUT_RESERVATION_MINUTES?.trim();
  const parsed = raw ? Number(raw) : 30;
  const reservation = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 30;
  const minutes = Math.min(
    STRIPE_SESSION_MAX_MINUTES,
    Math.max(STRIPE_SESSION_MIN_MINUTES, reservation),
  );
  return Math.floor(now / 1000) + minutes * 60;
}

function paymentIntentIdFrom(
  paymentIntent: string | Stripe.PaymentIntent | null,
): string | undefined {
  if (!paymentIntent) {
    return undefined;
  }
  return typeof paymentIntent === "string" ? paymentIntent : paymentIntent.id;
}

async function paymentIntentIdForRefund(
  client: Stripe,
  transactionId: string,
): Promise<string> {
  if (transactionId.startsWith("pi_")) {
    return transactionId;
  }
  const session = await client.checkout.sessions.retrieve(transactionId);
  const paymentIntentId = paymentIntentIdFrom(session.payment_intent);
  if (!paymentIntentId) {
    throw new Error("Stripe Checkout Session has no payment intent to refund.");
  }
  return paymentIntentId;
}

export type StripeProviderDeps = {
  getClient?: () => Stripe;
  now?: () => number;
};

export function createStripeProvider(
  deps: StripeProviderDeps = {},
): PaymentProvider {
  const getClient = deps.getClient ?? createStripeClient;

  return {
    name: "stripe",
    async beginCheckout(input: ChargeInput): Promise<CheckoutOutcome> {
      const client = getClient();
      const base = siteBaseUrl();
      const successParams = new URLSearchParams({ order: input.orderId });
      if (input.lookupToken) {
        successParams.set("token", input.lookupToken);
      }

      const itemSummary = input.items
        .map((item) => `${item.name} (${item.size}) × ${item.qty}`)
        .join(", ")
        .slice(0, 500);

      const address = {
        line1: input.billing.address1,
        line2: input.billing.address2 || undefined,
        city: input.billing.city,
        state: input.billing.state,
        postal_code: input.billing.zip,
        country: input.billing.country || "US",
      };
      const customerName =
        `${input.billing.firstName} ${input.billing.lastName}`.trim();
      const customer = await client.customers.create({
        email: input.billing.email,
        name: customerName || undefined,
        address,
        shipping: {
          name: customerName || input.billing.email,
          phone: input.billing.phone || undefined,
          address,
        },
      });

      const taxCode = stripeProductTaxCode();
      const useStripeTax =
        (process.env.TAX_PROVIDER ?? "mock").toLowerCase().trim() === "stripe";
      const session = await client.checkout.sessions.create({
        mode: "payment",
        integration_identifier: STRIPE_CHECKOUT_INTEGRATION_ID,
        client_reference_id: input.orderId,
        customer: customer.id,
        ...(useStripeTax ? { automatic_tax: { enabled: true } } : {}),
        expires_at: sessionExpiresAtUnix(deps.now?.() ?? Date.now()),
        success_url: `${base}/checkout/success?${successParams.toString()}`,
        cancel_url: `${base}/checkout?error=payment_cancelled`,
        metadata: {
          orderId: input.orderId,
          lookupToken: input.lookupToken ?? "",
        },
        payment_intent_data: {
          metadata: {
            orderId: input.orderId,
          },
          // Stripe Tax rejects payment_intent_data.shipping; Customer.shipping
          // is the address source for tax and receipts.
          ...(useStripeTax
            ? {}
            : {
                shipping: {
                  name: customerName,
                  phone: input.billing.phone || undefined,
                  address,
                },
              }),
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.currency.toLowerCase(),
              unit_amount: toCents(input.amount),
              tax_behavior: "exclusive",
              product_data: {
                name: `Order ${input.orderId}`,
                description: itemSummary || undefined,
                ...(taxCode ? { tax_code: taxCode } : {}),
              },
            },
          },
        ],
      });

      if (!session.url) {
        throw new Error("Stripe Checkout Session did not return a URL.");
      }

      return {
        kind: "redirect",
        url: session.url,
        transactionId: session.id,
      };
    },

    async refund(input: RefundInput): Promise<RefundOutcome> {
      try {
        const client = getClient();
        const paymentIntent = await paymentIntentIdForRefund(
          client,
          input.transactionId,
        );
        const refund = await client.refunds.create({
          payment_intent: paymentIntent,
          amount: toCents(input.amount),
        });
        return {
          ok: refund.status === "succeeded" || refund.status === "pending",
          transactionId: refund.id,
          message:
            refund.status === "failed" ? "Stripe refund failed." : undefined,
        };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error ? error.message : "Stripe refund failed.",
        };
      }
    },

    async cancel(input: {
      orderId: string;
      transactionId: string;
    }): Promise<RefundOutcome> {
      try {
        const client = getClient();
        if (input.transactionId.startsWith("cs_")) {
          const session = await client.checkout.sessions.expire(
            input.transactionId,
          );
          return {
            ok: session.status === "expired",
            transactionId: session.id,
          };
        }
        return {
          ok: false,
          message: "Stripe cancel requires a Checkout Session id.",
        };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Stripe session expire failed.",
        };
      }
    },
  };
}

export async function verifyStripeCheckout(input: {
  orderId: string;
  transactionId: string;
  getClient?: () => Stripe;
}): Promise<PaymentVerification> {
  let client: Stripe;
  try {
    client = input.getClient?.() ?? createStripeClient();
  } catch (error) {
    return {
      verified: false,
      status: "unknown",
      skipExpire: true,
      message:
        error instanceof Error ? error.message : "Stripe is not configured.",
    };
  }

  try {
    const session = input.transactionId.startsWith("cs_")
      ? await client.checkout.sessions.retrieve(input.transactionId)
      : null;

    if (!session) {
      return {
        verified: false,
        status: "unknown",
        skipExpire: true,
        message: "Stripe lookup requires a Checkout Session id.",
      };
    }

    const sessionOrderId =
      session.client_reference_id || session.metadata?.orderId || "";
    if (sessionOrderId && sessionOrderId !== input.orderId) {
      return {
        verified: false,
        status: "unknown",
        skipExpire: true,
        message: "Stripe session order id mismatch.",
      };
    }

    const amountCents = session.amount_total ?? undefined;
    const currency = session.currency?.toUpperCase();

    if (session.payment_status === "paid") {
      return {
        verified: true,
        status: "approved",
        amountCents,
        currency,
      };
    }

    if (session.status === "open") {
      return {
        verified: true,
        status: "pending",
        skipExpire: true,
        amountCents,
        currency,
      };
    }

    if (session.status === "expired") {
      return {
        verified: true,
        status: "cancelled",
        amountCents,
        currency,
      };
    }

    return {
      verified: true,
      status: "declined",
      amountCents,
      currency,
    };
  } catch (error) {
    return {
      verified: false,
      status: "unknown",
      skipExpire: true,
      message:
        error instanceof Error
          ? error.message
          : "Stripe session lookup failed.",
    };
  }
}
