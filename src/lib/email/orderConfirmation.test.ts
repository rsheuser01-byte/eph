import { afterEach, describe, expect, it, vi } from "vitest";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/seo/siteUrl";
import type { OrderEmailData } from "./orderConfirmation";
import {
  buildCustomerConfirmation,
  buildStoreNotification,
} from "./orderConfirmation";

afterEach(() => {
  vi.unstubAllEnvs();
});

const data: OrderEmailData = {
  orderId: "EPH-TEST-1",
  items: [
    { sku: "GLP-3-15MG", name: "GLP-3", size: "15mg", qty: 2, unitPrice: 69.99 },
  ],
  subtotal: 139.98,
  shipping: 12,
  tax: 0,
  total: 151.98,
  customer: {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "[email protected]",
    address1: "1 Lab St",
    city: "Denver",
    state: "CO",
    zip: "80014",
    country: "US",
  },
  siteName: "Elevate Precision Health",
};

describe("buildCustomerConfirmation", () => {
  it("addresses the customer and includes the order reference and total", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    const message = buildCustomerConfirmation(data);
    expect(message.to).toBe("[email protected]");
    expect(message.subject).toContain("EPH-TEST-1");
    expect(message.text).toContain("EPH-TEST-1");
    expect(message.text).toContain("$151.98");
    expect(message.html).toContain("GLP-3");
    expect(message.html).toContain(
      `${CANONICAL_PRODUCTION_ORIGIN}/images/logo.png`,
    );
    expect(message.html).toContain('alt="Elevate Precision Health"');
    expect(message.html).toContain("mailto:support@elevateprecisionhealth.com");
    expect(message.text).toContain("support@elevateprecisionhealth.com");
    expect(message.html).toContain("www.elevateprecisionhealth.com");
    expect(message.html).not.toContain("localhost");
  });

  it("escapes HTML in customer-provided fields", () => {
    const message = buildCustomerConfirmation({
      ...data,
      customer: { ...data.customer, firstName: "<script>", lastName: "x" },
    });
    expect(message.html).not.toContain("<script>");
    expect(message.html).toContain("&lt;script&gt;");
  });
});

describe("buildStoreNotification", () => {
  it("targets the store address and identifies the buyer", () => {
    const message = buildStoreNotification(data, "[email protected]");
    expect(message.to).toBe("[email protected]");
    expect(message.subject).toContain("EPH-TEST-1");
    expect(message.text).toContain("[email protected]");
  });
});
