import type { ChargeInput, CheckoutOutcome, PaymentProvider } from "./types";

// Bankful sandbox declines these numbers; everything else is approved.
const DECLINED_CARDS = new Set(["4111111111111112", "42423482938483873"]);

export function createMockProvider(): PaymentProvider {
  return {
    name: "mock",
    async beginCheckout(input: ChargeInput): Promise<CheckoutOutcome> {
      const digits = input.card.number.replace(/\D/g, "");
      const approved = !DECLINED_CARDS.has(digits);
      return {
        kind: "result",
        approved,
        orderId: input.orderId,
        transactionId: approved ? `mock_${Date.now()}` : undefined,
        message: approved ? undefined : "Card declined (mock).",
      };
    },
  };
}
