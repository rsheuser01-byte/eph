import { describe, expect, it } from "vitest";
import type { OrderEmailData } from "./orderConfirmation";
import {
  buildCancelledEmail,
  buildRefundEmail,
  buildShippedEmail,
} from "./orderNotifications";

const data: OrderEmailData = {
  orderId: "EPH-SHIP-1",
  items: [
    { sku: "GLP-3-15MG", name: "GLP-3", size: "15mg", qty: 1, unitPrice: 69.99 },
  ],
  subtotal: 69.99,
  shipping: 12,
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
    const message = buildRefundEmail(data, {
      refundedAmount: 81.99,
      totalRefunded: 81.99,
      partial: false,
    });
    expect(message.subject.toLowerCase()).toContain("refund");
    expect(message.text).toContain("$81.99");
    expect(message.text.toLowerCase()).toContain("full");
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
    const message = buildCancelledEmail(data);
    expect(message.to).toBe("ada@example.com");
    expect(message.subject.toLowerCase()).toContain("cancelled");
    expect(message.text).toContain("EPH-SHIP-1");
  });
});
