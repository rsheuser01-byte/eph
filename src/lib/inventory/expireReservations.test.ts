import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderRecord } from "@/lib/orders/types";
import { processExpiredReservations } from "./expireReservations";

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    orderId: "ord_1",
    createdAt: new Date().toISOString(),
    provider: "bankful-hpp",
    status: "pending",
    paymentStatus: "pending",
    fulfillmentStatus: "unfulfilled",
    items: [],
    subtotal: 10,
    shipping: 0,
    tax: 0,
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
    ...overrides,
  };
}

describe("processExpiredReservations", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("expires abandoned pending orders without a transaction id", async () => {
    const orders = new Map([["ord_1", makeOrder()]]);
    const expire = vi.fn().mockResolvedValue(undefined);
    const commit = vi.fn().mockResolvedValue(undefined);

    const result = await processExpiredReservations({
      orderStore: {
        name: "memory",
        async get(id) {
          return orders.get(id) ?? null;
        },
        async save() {},
        async list() {
          return [...orders.values()];
        },
        async updateStatus(id, patch) {
          const current = orders.get(id)!;
          const next = {
            ...current,
            ...patch,
            status: patch.paymentStatus ?? current.paymentStatus,
            paymentStatus: patch.paymentStatus ?? current.paymentStatus,
          };
          orders.set(id, next);
          return next;
        },
      },
      listExpiredOrderIds: async () => ["ord_1"],
      expire,
      commit,
    });

    expect(result.expired).toBe(1);
    expect(expire).toHaveBeenCalledWith("ord_1");
    expect(orders.get("ord_1")?.paymentStatus).toBe("expired");
    expect(commit).not.toHaveBeenCalled();
  });

  it("commits stock when pending order was already approved", async () => {
    const commit = vi.fn().mockResolvedValue(undefined);
    const expire = vi.fn().mockResolvedValue(undefined);
    const result = await processExpiredReservations({
      orderStore: {
        name: "memory",
        async get() {
          return makeOrder({ paymentStatus: "approved", status: "approved" });
        },
        async save() {},
        async list() {
          return [];
        },
      },
      listExpiredOrderIds: async () => ["ord_1"],
      commit,
      expire,
    });
    expect(result.committed).toBe(1);
    expect(commit).toHaveBeenCalledWith("ord_1");
    expect(expire).not.toHaveBeenCalled();
  });

  it("skips pending orders with transaction id when STATUS API is unset", async () => {
    const expire = vi.fn();
    const result = await processExpiredReservations({
      orderStore: {
        name: "memory",
        async get() {
          return makeOrder({ transactionId: "tx_1" });
        },
        async save() {},
        async list() {
          return [];
        },
      },
      listExpiredOrderIds: async () => ["ord_1"],
      expire,
      log: vi.fn(),
    });
    expect(result.skipped).toBe(1);
    expect(expire).not.toHaveBeenCalled();
  });

  it("commits when STATUS lookup confirms paid", async () => {
    vi.stubEnv("BANKFUL_STATUS_TRANSACTION_TYPE", "STATUS");
    const commit = vi.fn().mockResolvedValue(undefined);
    const orders = new Map([
      ["ord_1", makeOrder({ transactionId: "tx_1" })],
    ]);

    const result = await processExpiredReservations({
      orderStore: {
        name: "memory",
        async get(id) {
          return orders.get(id) ?? null;
        },
        async save() {},
        async list() {
          return [];
        },
        async updateStatus(id, patch) {
          const current = orders.get(id)!;
          const next = {
            ...current,
            ...patch,
            paymentStatus: patch.paymentStatus ?? current.paymentStatus,
            status: patch.paymentStatus ?? current.paymentStatus,
          };
          orders.set(id, next);
          return next;
        },
      },
      listExpiredOrderIds: async () => ["ord_1"],
      commit,
      verifyPayment: async () => ({
        verified: true,
        status: "approved" as const,
        amountCents: 1000,
        currency: "USD",
      }),
    });

    expect(result.committed).toBe(1);
    expect(orders.get("ord_1")?.paymentStatus).toBe("approved");
    expect(commit).toHaveBeenCalledWith("ord_1");
  });
});

describe("reservationExpiresAt helper", () => {
  beforeEach(() => {
    vi.stubEnv("CHECKOUT_RESERVATION_MINUTES", "30");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to 30 minutes", async () => {
    const { reservationExpiresAt, reservationMinutes } = await import(
      "./reservations"
    );
    expect(reservationMinutes()).toBe(30);
    const now = new Date("2026-07-28T12:00:00.000Z");
    expect(reservationExpiresAt(now).toISOString()).toBe(
      "2026-07-28T12:30:00.000Z",
    );
  });
});
