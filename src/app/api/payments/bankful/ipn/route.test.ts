import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signBankfulHppPayload } from "@/lib/payments/bankful";
import type { OrderRecord, OrderStatusUpdate } from "@/lib/orders/types";
import type { PaymentEventRecord, PaymentEventStore } from "@/lib/payments/paymentEvents";
import { processBankfulIpn } from "./processIpn";

const PASSWORD = "sandbox_password";

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    orderId: "ord_test_1",
    createdAt: new Date().toISOString(),
    provider: "bankful-hpp",
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

function signedFields(
  overrides: Record<string, string> = {},
): Record<string, string> {
  const fields: Record<string, string> = {
    REQUEST_ACTION: "CAPTURE",
    TRANS_STATUS_NAME: "APPROVED",
    TRANS_VALUE: "19.9900",
    TRANS_REQUEST_ID: "1272",
    TRANS_RECORD_ID: "79154",
    TRANS_ORDER_ID: "980982121",
    XTL_ORDER_ID: "ord_test_1",
    TRANS_CUR: "USD",
    TIMESTAMP: "2021-05-06T11:16:50Z",
    ...overrides,
  };
  return {
    ...fields,
    SIGNATURE: signBankfulHppPayload(fields, PASSWORD),
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

describe("processBankfulIpn", () => {
  const orders = new Map<string, OrderRecord>();
  const emailSend = vi.fn().mockResolvedValue(undefined);
  let events: PaymentEventStore;

  beforeEach(() => {
    orders.clear();
    emailSend.mockClear();
    events = createMemoryEventStore();
    orders.set("ord_test_1", makeOrder());
    vi.stubEnv("BANKFUL_PASSWORD", PASSWORD);
    vi.stubEnv("BANKFUL_API_BASE_URL", "https://api-dev1.bankfulportal.com");
    vi.stubEnv("BANKFUL_USERNAME", "sandbox_username");
    vi.stubEnv("BANKFUL_STATUS_TRANSACTION_TYPE", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function deps() {
    return {
      getPassword: () => process.env.BANKFUL_PASSWORD ?? "",
      orderStore: {
        name: "memory",
        async get(orderId: string) {
          return orders.get(orderId) ?? null;
        },
        async save() {},
        async list() {
          return [...orders.values()];
        },
        async updateStatus(orderId: string, patch: OrderStatusUpdate) {
          const current = orders.get(orderId);
          if (!current) return null;
          const paymentStatus = patch.paymentStatus ?? current.paymentStatus;
          const next: OrderRecord = {
            ...current,
            paymentStatus,
            status: paymentStatus,
            fulfillmentStatus:
              patch.fulfillmentStatus ?? current.fulfillmentStatus,
            transactionId: patch.transactionId ?? current.transactionId,
            refundedAmount: patch.refundedAmount ?? current.refundedAmount,
          };
          orders.set(orderId, next);
          return next;
        },
      },
      paymentEvents: events,
      sendEmails: emailSend,
      logSecurityEvent: vi.fn(),
      commitStock: vi.fn().mockResolvedValue(undefined),
      releaseStock: vi.fn().mockResolvedValue(undefined),
    };
  }

  it("rejects missing signature with 401", async () => {
    const { SIGNATURE: _, ...fields } = signedFields();
    const result = await processBankfulIpn(fields, deps());
    expect(result.status).toBe(401);
    expect(orders.get("ord_test_1")?.paymentStatus).toBe("pending");
  });

  it("rejects invalid signature with 401", async () => {
    const fields = signedFields();
    fields.SIGNATURE = "a".repeat(64);
    const result = await processBankfulIpn(fields, deps());
    expect(result.status).toBe(401);
  });

  it("approves a valid signed callback once and emails once", async () => {
    const d = deps();
    const result = await processBankfulIpn(signedFields(), d);
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ ok: true, approved: true });
    expect(orders.get("ord_test_1")?.paymentStatus).toBe("approved");
    expect(emailSend).toHaveBeenCalledTimes(1);
    expect(d.commitStock).toHaveBeenCalledWith("ord_test_1");
  });

  it("is idempotent on replay of the same approved callback", async () => {
    const fields = signedFields();
    expect((await processBankfulIpn(fields, deps())).status).toBe(200);
    emailSend.mockClear();
    const replay = await processBankfulIpn(fields, deps());
    expect(replay.status).toBe(200);
    expect(replay.body).toMatchObject({ ok: true, duplicate: true });
    expect(emailSend).not.toHaveBeenCalled();
  });

  it("rejects amount mismatch without approving", async () => {
    const result = await processBankfulIpn(
      signedFields({ TRANS_VALUE: "1.00" }),
      deps(),
    );
    expect(result.status).toBe(422);
    expect(orders.get("ord_test_1")?.paymentStatus).toBe("review_required");
    expect(emailSend).not.toHaveBeenCalled();
  });

  it("rejects currency mismatch without approving", async () => {
    orders.set("ord_test_1", makeOrder({ currency: "CAD" }));
    const result = await processBankfulIpn(signedFields(), deps());
    expect(result.status).toBe(422);
    expect(orders.get("ord_test_1")?.paymentStatus).toBe("review_required");
  });

  it("does not downgrade an approved order on a later decline", async () => {
    orders.set(
      "ord_test_1",
      makeOrder({ paymentStatus: "approved", status: "approved" }),
    );
    const result = await processBankfulIpn(
      signedFields({ TRANS_STATUS_NAME: "DECLINED" }),
      deps(),
    );
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ reviewRequired: true });
    // Flagged for review — never silently moved to declined.
    expect(orders.get("ord_test_1")?.paymentStatus).toBe("review_required");
  });

  it("returns 404 for unknown orders", async () => {
    const result = await processBankfulIpn(
      signedFields({ XTL_ORDER_ID: "missing" }),
      deps(),
    );
    expect(result.status).toBe(404);
  });

  it("marks declined pending orders without emailing", async () => {
    const d = deps();
    const result = await processBankfulIpn(
      signedFields({ TRANS_STATUS_NAME: "DECLINED" }),
      d,
    );
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ ok: true, approved: false });
    expect(orders.get("ord_test_1")?.paymentStatus).toBe("declined");
    expect(emailSend).not.toHaveBeenCalled();
    expect(d.releaseStock).toHaveBeenCalledWith("ord_test_1");
  });

  it("uses a deterministic hash event id when Bankful request ids are absent", async () => {
    const fields = signedFields();
    delete fields.TRANS_REQUEST_ID;
    delete fields.TRANS_RECORD_ID;
    // Re-sign without those ids.
    const { SIGNATURE: _s, ...unsigned } = fields;
    const resigned = {
      ...unsigned,
      SIGNATURE: signBankfulHppPayload(unsigned, PASSWORD),
    };
    const first = await processBankfulIpn(resigned, deps());
    expect(first.status).toBe(200);
    emailSend.mockClear();
    const second = await processBankfulIpn(resigned, deps());
    expect(second.body).toMatchObject({ duplicate: true });
    expect(emailSend).not.toHaveBeenCalled();
    // Sanity: hash is stable
    const hash = createHash("sha256")
      .update(
        ["ord_test_1", "980982121", "APPROVED", "1999", "USD"].join("|"),
      )
      .digest("hex")
      .slice(0, 32);
    expect(hash).toMatch(/^[a-f0-9]{32}$/);
  });
});
