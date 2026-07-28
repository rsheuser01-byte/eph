import {
  createBankfulHppProvider,
  createBankfulProvider,
} from "./bankful";
import { createMockHppProvider, createMockProvider } from "./mock";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
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
