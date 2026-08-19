import { afterEach, describe, expect, it, vi } from "vitest";
import type { PaymentStatus } from "@/lib/orders/types";
import {
  buildTrustpilotInvitation,
  createTrustpilotInvitationOnce,
  type TrustpilotInvitation,
} from "./invitation";

const SITE = "https://www.elevateprecisionhealth.com";

const baseOrder = {
  orderId: "EPH-1001",
  customer: {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
  },
  items: [
    { sku: "GLP-3-10MG", name: "GLP-3", size: "10mg" },
    { sku: "GLP-3-10MG", name: "GLP-3", size: "10mg" },
    { sku: "NAD-500MG", name: "NAD+", size: "500mg" },
  ],
};

function invitationFor(
  paymentStatus: PaymentStatus,
  overrides: Partial<typeof baseOrder> = {},
) {
  return buildTrustpilotInvitation({
    ...baseOrder,
    ...overrides,
    paymentStatus,
  });
}

describe("buildTrustpilotInvitation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds service and product review invitations after payment is approved", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);

    expect(invitationFor("approved")).toEqual({
      recipientEmail: "ada@example.com",
      recipientName: "Ada Lovelace",
      referenceId: "EPH-1001",
      source: "InvitationScript",
      productSkus: ["GLP-3-10MG", "NAD-500MG"],
      products: [
        {
          sku: "GLP-3-10MG",
          productUrl: `${SITE}/products/glp-3`,
          imageUrl: `${SITE}/products/glp-3-10mg.png`,
          name: "GLP-3",
        },
        {
          sku: "NAD-500MG",
          productUrl: `${SITE}/products/nad`,
          imageUrl: `${SITE}/products/nad-500mg.png`,
          name: "NAD+",
        },
      ],
    } satisfies TrustpilotInvitation);
  });

  it("also invites after a partial refund of a paid order", () => {
    expect(invitationFor("partially_refunded")?.referenceId).toBe("EPH-1001");
  });

  it("does not invite before payment is confirmed", () => {
    expect(invitationFor("pending")).toBeNull();
    expect(invitationFor("declined")).toBeNull();
    expect(invitationFor("cancelled")).toBeNull();
    expect(invitationFor("review_required")).toBeNull();
  });

  it("skips invitations without a usable email", () => {
    expect(
      invitationFor("approved", {
        customer: { firstName: "Ada", lastName: "Lovelace", email: "  " },
      }),
    ).toBeNull();
  });

  it("omits product fields when the order has no line items", () => {
    expect(invitationFor("approved", { items: [] })).toEqual({
      recipientEmail: "ada@example.com",
      recipientName: "Ada Lovelace",
      referenceId: "EPH-1001",
      source: "InvitationScript",
    });
  });

  it("keeps SKUs that are not in the catalog without inventing product URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", SITE);
    const invitation = invitationFor("approved", {
      items: [{ sku: "UNKNOWN-SKU", name: "Mystery", size: "1mg" }],
    });
    expect(invitation?.productSkus).toEqual(["UNKNOWN-SKU"]);
    expect(invitation?.products).toBeUndefined();
  });
});

describe("createTrustpilotInvitationOnce", () => {
  const invitation: TrustpilotInvitation = {
    recipientEmail: "ada@example.com",
    recipientName: "Ada Lovelace",
    referenceId: "EPH-1001",
    source: "InvitationScript",
  };

  it("sends createInvitation through the Trustpilot queue and records the order", () => {
    const calls: unknown[][] = [];
    const storage = memoryStorage();

    const sent = createTrustpilotInvitationOnce({
      tp: (...args) => {
        calls.push(args);
      },
      invitation,
      storage,
    });

    expect(sent).toBe(true);
    expect(calls).toEqual([["createInvitation", invitation]]);
    expect(storage.getItem("eph-tp-invite:EPH-1001")).toBe("1");
  });

  it("does not send twice for the same order in the same session", () => {
    const calls: unknown[][] = [];
    const storage = memoryStorage();
    const tp = (...args: unknown[]) => {
      calls.push(args);
    };

    createTrustpilotInvitationOnce({ tp, invitation, storage });
    const second = createTrustpilotInvitationOnce({ tp, invitation, storage });

    expect(second).toBe(false);
    expect(calls).toHaveLength(1);
  });

  it("returns false when the Trustpilot queue is not loaded yet", () => {
    expect(
      createTrustpilotInvitationOnce({
        invitation,
        storage: memoryStorage(),
      }),
    ).toBe(false);
  });
});

function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const data = new Map<string, string>();
  return {
    getItem(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
  };
}
