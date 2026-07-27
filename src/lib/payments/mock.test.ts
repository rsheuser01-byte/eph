import { describe, expect, it } from "vitest";
import { createMockProvider } from "./mock";
import type { ChargeInput } from "./types";

function chargeWith(number: string): ChargeInput {
  return {
    orderId: "TEST-1",
    amount: 81.99,
    currency: "USD",
    billing: {
      firstName: "Test",
      lastName: "Buyer",
      email: "[email protected]",
      address1: "1 Lab St",
      city: "Denver",
      state: "CO",
      zip: "80014",
      country: "US",
    },
    card: { number, expiryMonth: "12", expiryYear: "2030", cvv: "123" },
    items: [
      { sku: "GLP-3-15MG", name: "GLP-3", size: "15mg", qty: 1, unitPrice: 69.99 },
    ],
  };
}

describe("mock provider", () => {
  it("approves the documented success test card", async () => {
    const provider = createMockProvider();
    const outcome = await provider.beginCheckout(chargeWith("4111111111111111"));
    expect(outcome).toMatchObject({ kind: "result", approved: true });
  });

  it("declines the documented decline test card", async () => {
    const provider = createMockProvider();
    const outcome = await provider.beginCheckout(chargeWith("4111111111111112"));
    expect(outcome).toMatchObject({ kind: "result", approved: false });
  });

  it("ignores spaces in the card number", async () => {
    const provider = createMockProvider();
    const outcome = await provider.beginCheckout(
      chargeWith("4111 1111 1111 1111"),
    );
    expect(outcome).toMatchObject({ approved: true });
  });
});
