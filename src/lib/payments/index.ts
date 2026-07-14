import { createBankfulProvider } from "./bankful";
import { createMockProvider } from "./mock";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  const provider = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  switch (provider) {
    case "bankful":
      return createBankfulProvider();
    case "mock":
      return createMockProvider();
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER: ${provider}`);
  }
}

export type {
  BillingInfo,
  CardInput,
  ChargeInput,
  CheckoutOutcome,
  OrderItem,
  PaymentProvider,
} from "./types";
