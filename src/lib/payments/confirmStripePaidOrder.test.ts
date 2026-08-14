import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import type { OrderRecord, OrderStatusUpdate } from "@/lib/orders/types";
import { confirmStripePaidOrder } from "./confirmStripePaidOrder";

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    orderId: "EPH-1",
    createdAt: new Date().toISOString(),
    provider: "stripe",
    status: "pending",
    paymentStatus: "pending",
    fulfillmentStatus: "unfulfilled",
    transactionId: "cs_test_1",
    items: [
      {
        sku: "SKU1",
        name: "Test",
        size: "10mg",
        qty: 1,
        unitPrice: 19.99,
      },
    ],
    subtotal: 19.99,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 19.99,
    currency: "USD",
    customer: {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      address1: "1 Main",
      city: "Louisville",
      state: "KY",
      zip: "40202",
      country: "US",
    },
    refundedAmount: 0,
    ...overrides,
  };
}

function makeSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    id: "cs_test_1",
    object: "checkout.session",
    client_reference_id: "EPH-1",
    payment_status: "paid",
    status: "complete",
    amount_total: 1999,
    currency: "usd",
    payment_intent: "pi_test_1",
    metadata: { orderId: "EPH-1" },
    ...overrides,
  } as Stripe.Checkout.Session;
}

function deps(order: OrderRecord) {
  const orders = new Map([[order.orderId, order]]);
  const commitStock = vi.fn().mockResolvedValue(undefined);
  const enqueuePaid = vi.fn().mockResolvedValue(undefined);
  const retrieveSession = vi.fn().mockResolvedValue(makeSession());
  return {
    commitStock,
    enqueuePaid,
    retrieveSession,
    orders,
    handlers: {
      orderStore: {
        name: "memory",
        async get(id: string) {
          return orders.get(id) ?? null;
        },
        async save() {},
        async list() {
          return [...orders.values()];
        },
        async updateStatus(id: string, patch: OrderStatusUpdate) {
          const current = orders.get(id);
          if (!current) return null;
          const next = {
            ...current,
            paymentStatus: patch.paymentStatus ?? current.paymentStatus,
            status: (patch.paymentStatus ??
              current.paymentStatus) as OrderRecord["status"],
            ...(patch.transactionId !== undefined
              ? { transactionId: patch.transactionId }
              : {}),
          };
          orders.set(id, next);
          return next;
        },
      },
      retrieveSession,
      enqueuePaid,
      commitStock,
      logSecurityEvent: vi.fn(),
    },
  };
}

describe("confirmStripePaidOrder", () => {
  it("approves a pending order when Stripe already shows the session paid", async () => {
    const { handlers, commitStock, enqueuePaid, orders } = deps(makeOrder());
    await expect(confirmStripePaidOrder("EPH-1", handlers)).resolves.toBe(
      "approved",
    );
    expect(commitStock).toHaveBeenCalledWith("EPH-1");
    expect(enqueuePaid).toHaveBeenCalledWith("EPH-1");
    expect(orders.get("EPH-1")?.paymentStatus).toBe("approved");
    expect(orders.get("EPH-1")?.transactionId).toBe("pi_test_1");
  });

  it("leaves the order pending when the session is not paid yet", async () => {
    const { handlers, commitStock, orders } = deps(makeOrder());
    handlers.retrieveSession = vi
      .fn()
      .mockResolvedValue(makeSession({ payment_status: "unpaid" }));
    await expect(confirmStripePaidOrder("EPH-1", handlers)).resolves.toBe(
      "pending",
    );
    expect(commitStock).not.toHaveBeenCalled();
    expect(orders.get("EPH-1")?.paymentStatus).toBe("pending");
  });

  it("skips non-Stripe orders", async () => {
    const { handlers, retrieveSession } = deps(
      makeOrder({ provider: "mock-hpp" }),
    );
    await expect(confirmStripePaidOrder("EPH-1", handlers)).resolves.toBe(
      "skipped",
    );
    expect(retrieveSession).not.toHaveBeenCalled();
  });

  it("leaves the order pending when Stripe retrieve fails", async () => {
    const { handlers, commitStock, orders } = deps(makeOrder());
    handlers.retrieveSession = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(confirmStripePaidOrder("EPH-1", handlers)).resolves.toBe(
      "pending",
    );
    expect(commitStock).not.toHaveBeenCalled();
    expect(orders.get("EPH-1")?.paymentStatus).toBe("pending");
  });
});
