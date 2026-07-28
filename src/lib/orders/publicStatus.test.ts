import { describe, expect, it } from "vitest";
import {
  generateLookupToken,
  lookupTokensEqual,
  publicStatusFromPayment,
} from "./publicStatus";

describe("lookup tokens", () => {
  it("generates opaque base64url tokens", () => {
    const token = generateLookupToken();
    expect(token.length).toBeGreaterThan(20);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("compares tokens in constant time for equal length", () => {
    const token = generateLookupToken();
    expect(lookupTokensEqual(token, token)).toBe(true);
    expect(lookupTokensEqual(token, `${token.slice(0, -1)}x`)).toBe(false);
    expect(lookupTokensEqual(token, undefined)).toBe(false);
  });
});

describe("publicStatusFromPayment", () => {
  it("maps approved to payment confirmed without polling", () => {
    const status = publicStatusFromPayment("ord_1", "approved", "unfulfilled");
    expect(status.headline).toBe("Payment confirmed");
    expect(status.poll).toBe(false);
  });

  it("maps pending to processing with polling", () => {
    const status = publicStatusFromPayment("ord_1", "pending", "unfulfilled");
    expect(status.headline).toBe("Payment processing");
    expect(status.poll).toBe(true);
  });

  it("maps review_required distinctly", () => {
    const status = publicStatusFromPayment(
      "ord_1",
      "review_required",
      "unfulfilled",
    );
    expect(status.headline).toBe("Order requires review");
  });

  it("maps shipped fulfillment after payment", () => {
    const status = publicStatusFromPayment("ord_1", "approved", "shipped");
    expect(status.headline).toBe("Order shipped");
    expect(status.poll).toBe(false);
  });
});
