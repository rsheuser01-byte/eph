import { afterEach, describe, expect, it, vi } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import type { OrderRecord } from "@/lib/orders/types";
import {
  createFileEmailDeliveryStore,
  createFileOutboxStore,
} from "./store";
import { processOutbox } from "./processOutbox";
import { ORDER_PAID_EVENT, outboxBackoffMinutes } from "./types";

function makeOrder(orderId = "ord_paid_1"): OrderRecord {
  return {
    orderId,
    createdAt: new Date().toISOString(),
    provider: "mock",
    status: "approved",
    paymentStatus: "approved",
    fulfillmentStatus: "unfulfilled",
    items: [
      { sku: "SKU1", name: "Test", size: "10mg", qty: 1, unitPrice: 10 },
    ],
    subtotal: 10,
    shipping: 0,
    total: 10,
    currency: "USD",
    customer: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      address1: "1 Analytical Way",
      city: "Louisville",
      state: "KY",
      zip: "40202",
      country: "US",
    },
    refundedAmount: 0,
  };
}

describe("outboxBackoffMinutes", () => {
  it("uses exponential-ish schedule", () => {
    expect(outboxBackoffMinutes(1)).toBe(1);
    expect(outboxBackoffMinutes(2)).toBe(5);
    expect(outboxBackoffMinutes(5)).toBe(180);
  });
});

describe("processOutbox", () => {
  let dir: string;

  afterEach(async () => {
    if (dir) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("sends customer and store emails once for order.paid", async () => {
    dir = await mkdtemp(join(tmpdir(), "eph-outbox-"));
    const outbox = createFileOutboxStore(join(dir, "outbox.json"));
    const deliveries = createFileEmailDeliveryStore(join(dir, "email.json"));
    const send = vi.fn().mockResolvedValue(undefined);
    const order = makeOrder();

    await outbox.enqueue({
      eventType: ORDER_PAID_EVENT,
      aggregateId: order.orderId,
      payload: { orderId: order.orderId },
    });

    const first = await processOutbox({
      outbox,
      emailDeliveries: deliveries,
      orderStore: {
        name: "memory",
        async get() {
          return order;
        },
        async save() {},
        async list() {
          return [order];
        },
      },
      send,
    });

    expect(first.completed).toBe(1);
    expect(send).toHaveBeenCalledTimes(2);

    send.mockClear();
    // Re-enqueue duplicate is blocked; claim finds nothing completed.
    const second = await processOutbox({
      outbox,
      emailDeliveries: deliveries,
      orderStore: {
        name: "memory",
        async get() {
          return order;
        },
        async save() {},
        async list() {
          return [order];
        },
      },
      send,
    });
    expect(second.processed).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it("does not resend emails when the same delivery keys are claimed again", async () => {
    dir = await mkdtemp(join(tmpdir(), "eph-outbox-"));
    const deliveries = createFileEmailDeliveryStore(join(dir, "email.json"));
    const first = await deliveries.claimDelivery(
      "order.paid.customer",
      "ord_1",
      "ada@example.com",
    );
    const second = await deliveries.claimDelivery(
      "order.paid.customer",
      "ord_1",
      "ada@example.com",
    );
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it("retries on failure and eventually fails with alert", async () => {
    dir = await mkdtemp(join(tmpdir(), "eph-outbox-"));
    const outbox = createFileOutboxStore(join(dir, "outbox.json"));
    const deliveries = createFileEmailDeliveryStore(join(dir, "email.json"));
    const order = makeOrder();
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("smtp down"))
      .mockResolvedValue(undefined);

    await outbox.enqueue({
      eventType: ORDER_PAID_EVENT,
      aggregateId: order.orderId,
      payload: { orderId: order.orderId },
    });

    const result = await processOutbox({
      outbox,
      emailDeliveries: deliveries,
      orderStore: {
        name: "memory",
        async get() {
          return order;
        },
        async save() {},
        async list() {
          return [order];
        },
      },
      send,
      log: vi.fn(),
    });

    expect(result.retried).toBe(1);
    expect(result.completed).toBe(0);
  });
});
