import type {
  ChargeInput,
  CheckoutOutcome,
  PaymentProvider,
  RefundInput,
  RefundOutcome,
} from "./types";

// Bankful sandbox declines these numbers; everything else is approved.
const DECLINED_CARDS = new Set(["4111111111111112", "42423482938483873"]);

export function createMockProvider(): PaymentProvider {
  return {
    name: "mock",
    async beginCheckout(input: ChargeInput): Promise<CheckoutOutcome> {
      const digits = (input.card?.number ?? "").replace(/\D/g, "");
      const approved = !DECLINED_CARDS.has(digits);
      return {
        kind: "result",
        approved,
        orderId: input.orderId,
        transactionId: approved ? `mock_${Date.now()}` : undefined,
        message: approved ? undefined : "Card declined (mock).",
      };
    },
    async refund(input: RefundInput): Promise<RefundOutcome> {
      if (!input.transactionId.startsWith("mock_")) {
        return { ok: false, message: "Unknown mock transaction." };
      }
      return {
        ok: true,
        transactionId: `mock_refund_${Date.now()}`,
      };
    },
    async cancel(): Promise<RefundOutcome> {
      return { ok: true, transactionId: `mock_cancel_${Date.now()}` };
    },
  };
}

/** Mock HPP: returns a local redirect that completes via IPN simulation helper. */
export function createMockHppProvider(): PaymentProvider {
  return {
    name: "mock-hpp",
    async beginCheckout(input: ChargeInput): Promise<CheckoutOutcome> {
      const base =
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
        "http://localhost:3000";
      return {
        kind: "redirect",
        url: `${base}/api/payments/mock-hpp/complete?order=${encodeURIComponent(input.orderId)}`,
      };
    },
    async refund(input: RefundInput): Promise<RefundOutcome> {
      return createMockProvider().refund!(input);
    },
    async cancel(): Promise<RefundOutcome> {
      return { ok: true, transactionId: `mock_cancel_${Date.now()}` };
    },
  };
}
