import { describe, expect, it, vi } from "vitest";
import type { OrderRecord } from "@/lib/orders/types";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { loadPublicOrderStatus } from "./loadPublicStatus";

const order: OrderRecord = {
  orderId: "ord_status_1",
  createdAt: new Date().toISOString(),
  provider: "bankful-hpp",
  status: "pending",
  paymentStatus: "pending",
  fulfillmentStatus: "unfulfilled",
  items: [{ sku: "GLP-3-10MG", name: "GLP-3", size: "10mg", qty: 1, unitPrice: 10 }],
  subtotal: 10,
  shipping: 0,
  tax: 0,
  discount: 0,
  total: 10,
  currency: "USD",
  customer: {
    firstName: "A",
    lastName: "B",
    email: "a@b.com",
    address1: "1",
    city: "X",
    state: "KY",
    zip: "40000",
    country: "US",
  },
  refundedAmount: 0,
  lookupToken: "lookup-token-value-32chars-minimum!!",
};

vi.mock("@/lib/orders", () => ({
  getOrderStore: () => ({
    name: "memory",
    async get(orderId: string) {
      return orderId === order.orderId ? order : null;
    },
    async save() {},
    async list() {
      return [order];
    },
  }),
}));

describe("loadPublicOrderStatus", () => {
  it("returns null without token or with wrong token", async () => {
    await expect(loadPublicOrderStatus("ord_status_1", "")).resolves.toBeNull();
    await expect(
      loadPublicOrderStatus(
        "ord_status_1",
        "wrong-token-value-32chars-minimum!!",
      ),
    ).resolves.toBeNull();
  });

  it("returns public fields for a valid token", async () => {
    const status = await loadPublicOrderStatus(
      "ord_status_1",
      order.lookupToken!,
    );
    expect(status).toMatchObject({
      orderId: "ord_status_1",
      paymentStatus: "pending",
      headline: "Payment processing",
      poll: true,
    });
    expect(status?.reviewInvitation).toBeUndefined();
  });

  it("includes a Trustpilot invitation payload after payment is approved", async () => {
    const previous = order.paymentStatus;
    order.paymentStatus = "approved";
    order.status = "approved";
    try {
      const siteUrl = getSiteUrl();
      const status = await loadPublicOrderStatus(
        "ord_status_1",
        order.lookupToken!,
      );
      expect(status?.reviewInvitation).toEqual({
        recipientEmail: "a@b.com",
        recipientName: "A B",
        referenceId: "ord_status_1",
        source: "InvitationScript",
        productSkus: ["GLP-3-10MG"],
        products: [
          {
            sku: "GLP-3-10MG",
            productUrl: `${siteUrl}/products/glp-3`,
            imageUrl: `${siteUrl}/products/glp-3-10mg.png`,
            name: "GLP-3 (Retatrutide)",
          },
        ],
      });
    } finally {
      order.paymentStatus = previous;
      order.status = previous;
    }
  });
});
