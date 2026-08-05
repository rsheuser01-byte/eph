import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrderRecord } from "@/lib/orders/types";
import { resetMemoryRateLimits } from "@/lib/security/rateLimit";

const assertAdminApiSession = vi.fn();
const getOrder = vi.fn();
const updateStatus = vi.fn();
const refund = vi.fn();
const adjustStock = vi.fn();
const enqueueOrderRefunded = vi.fn();
const writeAuditLog = vi.fn();

vi.mock("@/lib/admin/auth", () => ({
  assertAdminApiSession: () => assertAdminApiSession(),
}));

vi.mock("@/lib/orders", () => ({
  getOrderStore: () => ({
    name: "memory",
    get: (orderId: string) => getOrder(orderId),
    updateStatus: (...args: unknown[]) => updateStatus(...args),
    save: async () => {},
    list: async () => [],
  }),
}));

vi.mock("@/lib/payments", () => ({
  getPaymentProvider: () => ({
    name: "mock",
    refund: (...args: unknown[]) => refund(...args),
  }),
}));

vi.mock("@/lib/inventory", () => ({
  adjustStock: (...args: unknown[]) => adjustStock(...args),
  stockItemsFromOrder: () => [{ sku: "SKU1", qty: 1 }],
}));

vi.mock("@/lib/outbox/enqueue", () => ({
  enqueueOrderRefunded: (...args: unknown[]) => enqueueOrderRefunded(...args),
}));

vi.mock("@/lib/security/audit", () => ({
  writeAuditLog: (...args: unknown[]) => writeAuditLog(...args),
}));

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    orderId: "ord_refund_1",
    createdAt: new Date().toISOString(),
    provider: "mock",
    status: "approved",
    paymentStatus: "approved",
    fulfillmentStatus: "unfulfilled",
    items: [
      {
        sku: "SKU1",
        name: "Test",
        size: "10mg",
        qty: 1,
        unitPrice: 50,
      },
    ],
    subtotal: 50,
    shipping: 0,
    tax: 0,
    discount: 0,
    total: 50,
    currency: "USD",
    customer: {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      address1: "1 Lab St",
      city: "Louisville",
      state: "KY",
      zip: "40202",
      country: "US",
    },
    refundedAmount: 0,
    transactionId: "txn_abc",
    ...overrides,
  };
}

describe("POST /api/admin/orders/[orderId]/refund", () => {
  beforeEach(() => {
    assertAdminApiSession.mockResolvedValue(true);
    getOrder.mockReset();
    updateStatus.mockReset().mockResolvedValue(undefined);
    refund.mockReset();
    adjustStock.mockReset().mockResolvedValue(undefined);
    enqueueOrderRefunded.mockReset().mockResolvedValue(undefined);
    writeAuditLog.mockReset().mockResolvedValue(undefined);
    resetMemoryRateLimits();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns 401 when the admin session is missing", async () => {
    assertAdminApiSession.mockResolvedValue(false);
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/orders/ord_refund_1/refund", {
        method: "POST",
        body: "{}",
      }),
      { params: Promise.resolve({ orderId: "ord_refund_1" }) },
    );
    expect(response.status).toBe(401);
  });

  it("rejects refunds when payment is not approved", async () => {
    getOrder.mockResolvedValue(makeOrder({ paymentStatus: "pending" }));
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/orders/ord_refund_1/refund", {
        method: "POST",
        body: "{}",
      }),
      { params: Promise.resolve({ orderId: "ord_refund_1" }) },
    );
    expect(response.status).toBe(400);
    expect(refund).not.toHaveBeenCalled();
  });

  it("refunds via the payment provider, updates status, restocks, and enqueues email", async () => {
    getOrder.mockResolvedValue(makeOrder());
    refund.mockResolvedValue({ ok: true });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/orders/ord_refund_1/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ orderId: "ord_refund_1" }) },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      ok: boolean;
      paymentStatus: string;
      restocked: boolean;
    };
    expect(body).toMatchObject({
      ok: true,
      paymentStatus: "refunded",
      restocked: true,
    });
    expect(refund).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "ord_refund_1",
        transactionId: "txn_abc",
        amount: 50,
      }),
    );
    expect(updateStatus).toHaveBeenCalledWith(
      "ord_refund_1",
      expect.objectContaining({
        paymentStatus: "refunded",
        refundedAmount: 50,
      }),
    );
    expect(adjustStock).toHaveBeenCalled();
    expect(enqueueOrderRefunded).toHaveBeenCalled();
    expect(writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "order.refund" }),
      expect.anything(),
    );
  });

  it("returns provider failure without mutating the order", async () => {
    getOrder.mockResolvedValue(makeOrder());
    refund.mockResolvedValue({ ok: false, message: "Gateway declined" });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/orders/ord_refund_1/refund", {
        method: "POST",
        body: "{}",
      }),
      { params: Promise.resolve({ orderId: "ord_refund_1" }) },
    );

    expect(response.status).toBe(402);
    expect(updateStatus).not.toHaveBeenCalled();
    expect(enqueueOrderRefunded).not.toHaveBeenCalled();
  });
});
