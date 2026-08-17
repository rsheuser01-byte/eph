import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCartConvertedPayload,
  buildCheckoutIdentifiedPayload,
  buildEmailPayload,
  buildStatusPayload,
  canSendRecoveryEmail,
  effectiveCartStatus,
} from "./payload";
import type { SavedCart } from "./types";

afterEach(() => {
  vi.unstubAllEnvs();
});

function cart(overrides: Partial<SavedCart> = {}): SavedCart {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    publicId: "pub_abc",
    sessionIdHash: "hash",
    restoreToken: "restore-token-value",
    email: "ada@example.com",
    firstName: "Ada",
    items: [
      {
        slug: "glp-3",
        size: "15mg",
        sku: "GLP-3-15MG",
        name: "GLP-3",
        quantity: 1,
        unitPrice: 69.99,
        imageUrl: "https://example.com/glp-3.png",
      },
    ],
    subtotal: 69.99,
    currency: "USD",
    status: "active",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    identifiedAt: "2026-08-01T00:00:00.000Z",
    checkoutStartedAt: null,
    convertedAt: null,
    orderId: null,
    lastRecoveryEventAt: null,
    identifiedEventSentAt: null,
    convertedEventSentAt: null,
    expiresAt: "2026-09-01T00:00:00.000Z",
    cartRecoveryConsent: true,
    ...overrides,
  };
}

describe("effectiveCartStatus", () => {
  it("marks past expiresAt as expired", () => {
    expect(
      effectiveCartStatus(cart({ expiresAt: "2020-01-01T00:00:00.000Z" })),
    ).toBe("expired");
  });

  it("keeps converted carts converted", () => {
    expect(effectiveCartStatus(cart({ status: "converted" }))).toBe("converted");
  });
});

describe("canSendRecoveryEmail", () => {
  it("requires consent, items, email, and an active cart", () => {
    expect(canSendRecoveryEmail(cart())).toBe(true);
    expect(canSendRecoveryEmail(cart({ cartRecoveryConsent: false }))).toBe(
      false,
    );
    expect(canSendRecoveryEmail(cart({ email: null }))).toBe(false);
    expect(canSendRecoveryEmail(cart({ items: [], subtotal: 0 }))).toBe(false);
    expect(canSendRecoveryEmail(cart({ status: "converted" }))).toBe(false);
  });
});

describe("payload builders", () => {
  it("builds a checkout_identified payload with public ids and restore URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.elevateprecisionhealth.com");
    const payload = buildCheckoutIdentifiedPayload(cart());
    expect(payload.event).toBe("checkout_identified");
    expect(payload.cartId).toBe("pub_abc");
    expect(payload.idempotencyKey).toBe("abandoned-cart:pub_abc");
    expect(payload.restoreUrl).toContain("/cart/restore/restore-token-value");
    expect(payload.restoreUrl).not.toContain("ada@example.com");
    expect(payload.restoreUrl).not.toContain("11111111-1111-4111-8111");
    expect(payload.statusCheckUrl).toContain("/api/abandoned-cart/pub_abc/status");
    expect(payload.canEmail).toBe(true);
  });

  it("builds status and email payloads without leaking restore tokens in status", () => {
    const status = buildStatusPayload(cart());
    expect(status).toEqual({
      status: "active",
      converted: false,
      expired: false,
      canEmail: true,
    });
    expect(JSON.stringify(status)).not.toContain("ada@example.com");

    const email = buildEmailPayload(cart());
    expect(email.email).toBe("ada@example.com");
    expect(email.restoreUrl).toContain("restore-token-value");
  });

  it("builds a converted webhook payload", () => {
    const payload = buildCartConvertedPayload(
      cart({ orderId: "EPH-1", status: "converted" }),
    );
    expect(payload).toEqual({
      event: "cart_converted",
      cartId: "pub_abc",
      orderId: "EPH-1",
      idempotencyKey: "abandoned-cart:pub_abc:converted",
    });
  });
});
