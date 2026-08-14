import {
  createBankfulHppProvider,
  createBankfulProvider,
  verifyBankfulTransaction,
} from "./bankful";
import { createMockHppProvider, createMockProvider } from "./mock";
import { createStripeProvider, verifyStripeCheckout } from "./stripe";
import type { PaymentProvider, PaymentVerification } from "./types";
import {
  ProductionConfigurationError,
  isProductionRuntime,
} from "@/lib/config/productionReadiness";

const HOSTED_PROVIDERS = new Set(["stripe", "bankful-hpp", "mock-hpp"]);

export function getPaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();

  if (isProductionRuntime() && provider !== "stripe") {
    console.error(
      "[config] blocked unsafe PAYMENT_PROVIDER in production",
      provider,
    );
    throw new ProductionConfigurationError([
      {
        key: "PAYMENT_PROVIDER",
        message:
          "Production requires PAYMENT_PROVIDER=stripe; mock and on-site card capture are disabled.",
        severity: "error",
      },
    ]);
  }

  switch (provider) {
    case "stripe":
      return createStripeProvider();
    case "bankful":
      return createBankfulProvider();
    case "bankful-hpp":
      return createBankfulHppProvider();
    case "mock-hpp":
      return createMockHppProvider();
    case "mock":
      return createMockProvider();
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER: ${provider}`);
  }
}

export function paymentProviderRequiresCard(providerName: string): boolean {
  return !HOSTED_PROVIDERS.has(providerName);
}

export async function verifyPaymentTransaction(input: {
  orderId: string;
  transactionId: string;
  provider?: string;
}): Promise<PaymentVerification> {
  const name = (
    input.provider ??
    process.env.PAYMENT_PROVIDER ??
    "mock"
  ).toLowerCase();

  if (name === "stripe") {
    return verifyStripeCheckout(input);
  }

  if (name === "bankful" || name === "bankful-hpp") {
    return verifyBankfulTransaction(input);
  }

  return {
    verified: false,
    status: "unknown",
    message: `No payment verification for provider ${name}.`,
  };
}

export type {
  BillingInfo,
  CardInput,
  ChargeInput,
  CheckoutOutcome,
  OrderItem,
  PaymentProvider,
  PaymentVerification,
  RefundInput,
  RefundOutcome,
} from "./types";
