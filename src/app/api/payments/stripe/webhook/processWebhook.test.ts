import { describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import type { OrderRecord, OrderStatusUpdate } from "@/lib/orders/types";
import type {
  PaymentEventRecord,
  PaymentEventStore,
} from "@/lib/payments/paymentEvents";
import { processStripeWebhookEvent } from "./processWebhook";

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    orderId: "EPH-1",
    createdAt: new Date().toISOString(),
    provider: "stripe",
    status: "pending",
    paymentStatus: "pending",
    fulfillmentStatus: "unfulfilled",
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

function createMemoryEventStore(): PaymentEventStore {
  const rows: PaymentEventRecord[] = [];
  return {
    name: "memory",
    async findByProviderEventId(provider, providerEventId) {
      return (
        rows.find(
          (row) =>
            row.provider === provider &&
            row.providerEventId === providerEventId,
        ) ?? null
      );
    },
    async insert(input) {
      if (input.providerEventId) {
        const existing = rows.find(
          (row) =>
            row.provider === input.provider &&
            row.providerEventId === input.providerEventId,
        );
        if (existing) {
          return { event: existing, duplicate: true };
        }
      }
      const event: PaymentEventRecord = {
        id: `evt_${rows.length + 1}`,
        provider: input.provider,
        providerEventId: input.providerEventId ?? null,
        orderId: input.orderId ?? null,
        transactionId: input.transactionId ?? null,
        eventType: input.eventType,
        signatureValid: input.signatureValid,
        processingStatus: input.processingStatus ?? "received",
        payload: input.payload,
        errorMessage: input.errorMessage ?? null,
        createdAt: new Date().toISOString(),
        processedAt: null,
      };
      rows.push(event);
      return { event, duplicate: false };
    },
    async markProcessed(id, patch) {
      const row = rows.find((item) => item.id === id);
      if (!row) return;
      row.processingStatus = patch.processingStatus;
      row.errorMessage = patch.errorMessage ?? null;
      row.processedAt = new Date().toISOString();
    },
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

function makeEvent(
  type: Stripe.Event["type"],
  session: Stripe.Checkout.Session,
  id = "evt_test_1",
): Stripe.Event {
  return {
    id,
    object: "event",
    type,
    data: { object: session },
  } as Stripe.Event;
}

function deps(order: OrderRecord) {
  const orders = new Map([[order.orderId, order]]);
  const commitStock = vi.fn().mockResolvedValue(undefined);
  const releaseStock = vi.fn().mockResolvedValue(undefined);
  const enqueuePaid = vi.fn().mockResolvedValue(undefined);
  return {
    commitStock,
    releaseStock,
    enqueuePaid,
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
          const next: OrderRecord = {
            ...current,
            paymentStatus: patch.paymentStatus ?? current.paymentStatus,
            status: (patch.paymentStatus ??
              current.paymentStatus) as OrderRecord["status"],
            ...(patch.transactionId !== undefined
              ? { transactionId: patch.transactionId }
              : {}),
            ...(patch.tax !== undefined ? { tax: patch.tax } : {}),
            ...(patch.total !== undefined ? { total: patch.total } : {}),
            ...(patch.taxProvider !== undefined
              ? { taxProvider: patch.taxProvider }
              : {}),
          };
          orders.set(id, next);
          return next;
        },
      },
      paymentEvents: createMemoryEventStore(),
      enqueuePaid,
      logSecurityEvent: vi.fn(),
      retrieveSession: async () => makeSession(),
      commitStock,
      releaseStock,
    },
    orders,
  };
}

describe("processStripeWebhookEvent", () => {
  it("ignores unrelated event types", async () => {
    const { handlers } = deps(makeOrder());
    const result = await processStripeWebhookEvent(
      makeEvent("charge.succeeded", makeSession()),
      handlers,
    );
    expect(result).toEqual({ status: 200, body: { ok: true, ignored: true } });
  });

  it("approves a paid Checkout Session and commits stock", async () => {
    const { handlers, commitStock, enqueuePaid, orders } = deps(makeOrder());
    const result = await processStripeWebhookEvent(
      makeEvent("checkout.session.completed", makeSession()),
      handlers,
    );
    expect(result.status).toBe(200);
    expect(result.body.approved).toBe(true);
    expect(commitStock).toHaveBeenCalledWith("EPH-1");
    expect(enqueuePaid).toHaveBeenCalledWith("EPH-1");
    expect(orders.get("EPH-1")?.paymentStatus).toBe("approved");
    expect(orders.get("EPH-1")?.transactionId).toBe("pi_test_1");
  });

  it("is idempotent for duplicate Stripe event ids", async () => {
    const { handlers, commitStock } = deps(makeOrder());
    const event = makeEvent("checkout.session.completed", makeSession());
    expect((await processStripeWebhookEvent(event, handlers)).status).toBe(200);
    const replay = await processStripeWebhookEvent(event, handlers);
    expect(replay.body.duplicate).toBe(true);
    expect(commitStock).toHaveBeenCalledTimes(1);
  });

  it("records Stripe Tax on the order when Checkout adds tax", async () => {
    const { handlers, orders } = deps(makeOrder());
    handlers.retrieveSession = async () =>
      makeSession({
        amount_total: 2119,
        total_details: { amount_tax: 120 } as Stripe.Checkout.Session.TotalDetails,
      });
    const result = await processStripeWebhookEvent(
      makeEvent("checkout.session.completed", makeSession()),
      handlers,
    );
    expect(result.status).toBe(200);
    expect(orders.get("EPH-1")?.tax).toBe(1.2);
    expect(orders.get("EPH-1")?.total).toBe(21.19);
    expect(orders.get("EPH-1")?.paymentStatus).toBe("approved");
  });

  it("flags review_required on amount mismatch", async () => {
    const { handlers, orders, commitStock } = deps(makeOrder());
    handlers.retrieveSession = async () =>
      makeSession({ amount_total: 1 });
    const result = await processStripeWebhookEvent(
      makeEvent("checkout.session.completed", makeSession({ amount_total: 1 })),
      handlers,
    );
    expect(result.status).toBe(422);
    expect(orders.get("EPH-1")?.paymentStatus).toBe("review_required");
    expect(commitStock).not.toHaveBeenCalled();
  });

  it("releases stock when the session expires unpaid", async () => {
    const { handlers, releaseStock, orders } = deps(makeOrder());
    handlers.retrieveSession = async () =>
      makeSession({
        payment_status: "unpaid",
        status: "expired",
        payment_intent: null,
      });
    const result = await processStripeWebhookEvent(
      makeEvent(
        "checkout.session.expired",
        makeSession({
          payment_status: "unpaid",
          status: "expired",
        }),
      ),
      handlers,
    );
    expect(result.status).toBe(200);
    expect(result.body.expired).toBe(true);
    expect(releaseStock).toHaveBeenCalledWith("EPH-1");
    expect(orders.get("EPH-1")?.paymentStatus).toBe("expired");
  });

  it("leaves pending when checkout completed but payment is still unpaid", async () => {
    const { handlers, commitStock, orders } = deps(makeOrder());
    handlers.retrieveSession = async () =>
      makeSession({ payment_status: "unpaid", status: "complete" });
    const result = await processStripeWebhookEvent(
      makeEvent(
        "checkout.session.completed",
        makeSession({ payment_status: "unpaid" }),
      ),
      handlers,
    );
    expect(result.body.pending).toBe(true);
    expect(commitStock).not.toHaveBeenCalled();
    expect(orders.get("EPH-1")?.paymentStatus).toBe("pending");
  });
});
