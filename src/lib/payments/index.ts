import {
  createBankfulHppProvider,
  createBankfulProvider,
} from "./bankful";
import { createMockHppProvider, createMockProvider } from "./mock";
import type { PaymentProvider } from "./types";
import {
  ProductionConfigurationError,
  isProductionRuntime,
} from "@/lib/config/productionReadiness";

export function getPaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();

  if (
    isProductionRuntime() &&
    (provider === "mock" ||
      provider === "mock-hpp" ||
      provider === "bankful")
  ) {
    console.error(
      "[config] blocked unsafe PAYMENT_PROVIDER in production",
      provider,
    );
    throw new ProductionConfigurationError([
      {
        key: "PAYMENT_PROVIDER",
        message:
          "Production requires PAYMENT_PROVIDER=bankful-hpp; mock and direct card capture are disabled.",
        severity: "error",
      },
    ]);
  }

  switch (provider) {
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
  return providerName !== "bankful-hpp" && providerName !== "mock-hpp";
}

export type {
  BillingInfo,
  CardInput,
  ChargeInput,
  CheckoutOutcome,
  OrderItem,
  PaymentProvider,
  RefundInput,
  RefundOutcome,
} from "./types";
