import { afterEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/seo/siteUrl";
import type { OrderEmailData } from "./orderConfirmation";
import {
  buildCancelledEmail,
  buildRefundEmail,
  buildShippedEmail,
} from "./orderNotifications";

afterEach(() => {
  vi.unstubAllEnvs();
});

const data: OrderEmailData = {
  orderId: "EPH-SHIP-1",
  items: [
    { sku: "GLP-3-15MG", name: "GLP-3", size: "15mg", qty: 1, unitPrice: 69.99 },
  ],
  subtotal: 69.99,
  shipping: 12,
  tax: 0,
  total: 81.99,
  customer: {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    address1: "1 Lab St",
    city: "Denver",
    state: "CO",
    zip: "80014",
    country: "US",
  },
  siteName: "Elevate Precision Health",
};

describe("buildShippedEmail", () => {
  it("includes carrier and tracking details", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const message = buildShippedEmail(data, {
      carrier: "UPS",
      trackingNumber: "1Z999",
      trackingUrl: "https://track.example/1Z999",
    });
    expect(message.to).toBe("ada@example.com");
    expect(message.subject).toContain("shipped");
    expect(message.text).toContain("UPS");
    expect(message.text).toContain("1Z999");
    expect(message.text).toContain("https://track.example/1Z999");
    expect(message.html).toContain("https://track.example/1Z999");
    expect(message.html).toContain(
      `${CANONICAL_PRODUCTION_ORIGIN}/images/logo.png`,
    );
  });

  it("omits non-http tracking URLs from HTML links", () => {
    const message = buildShippedEmail(data, {
      carrier: "UPS",
      trackingNumber: "1Z999",
      trackingUrl: "javascript:alert(1)",
    });
    expect(message.html).not.toContain("javascript:");
    expect(message.html).not.toContain("Track your shipment");
  });
});

describe("buildRefundEmail", () => {
  it("describes a full refund", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const message = buildRefundEmail(data, {
      refundedAmount: 81.99,
      totalRefunded: 81.99,
      partial: false,
    });
    expect(message.subject.toLowerCase()).toContain("refund");
    expect(message.text).toContain("$81.99");
    expect(message.text.toLowerCase()).toContain("full");
    expect(message.html).toContain(
      `${CANONICAL_PRODUCTION_ORIGIN}/images/logo.png`,
    );
  });

  it("describes a partial refund", () => {
    const message = buildRefundEmail(data, {
      refundedAmount: 20,
      totalRefunded: 20,
      partial: true,
    });
    expect(message.text.toLowerCase()).toContain("partial");
    expect(message.text).toContain("$20.00");
  });
});

describe("buildCancelledEmail", () => {
  it("notifies the customer the order was cancelled", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const message = buildCancelledEmail(data);
    expect(message.to).toBe("ada@example.com");
    expect(message.subject.toLowerCase()).toContain("cancelled");
    expect(message.text).toContain("EPH-SHIP-1");
    expect(message.html).toContain(
      `${CANONICAL_PRODUCTION_ORIGIN}/images/logo.png`,
    );
  });
});
