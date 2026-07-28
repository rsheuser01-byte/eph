import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyBankfulTransaction } from "./bankful";

describe("verifyBankfulTransaction", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("fails closed when Bankful credentials are missing", async () => {
    vi.stubEnv("BANKFUL_API_BASE_URL", "");
    vi.stubEnv("BANKFUL_USERNAME", "");
    vi.stubEnv("BANKFUL_PASSWORD", "");
    const result = await verifyBankfulTransaction({
      orderId: "ord_1",
      transactionId: "tx_1",
    });
    expect(result.verified).toBe(false);
    expect(result.status).toBe("unknown");
  });

  it("fails closed when STATUS lookup is not configured and no authenticated callback is provided", async () => {
    vi.stubEnv("BANKFUL_API_BASE_URL", "https://api-dev1.bankfulportal.com");
    vi.stubEnv("BANKFUL_USERNAME", "user");
    vi.stubEnv("BANKFUL_PASSWORD", "pass");
    vi.stubEnv("BANKFUL_STATUS_TRANSACTION_TYPE", "");

    const result = await verifyBankfulTransaction({
      orderId: "ord_1",
      transactionId: "tx_1",
    });
    expect(result.verified).toBe(false);
    expect(result.message).toMatch(/not configured|TODO/i);
  });

  it("reconciles from a signature-authenticated callback payload", async () => {
    vi.stubEnv("BANKFUL_API_BASE_URL", "https://api-dev1.bankfulportal.com");
    vi.stubEnv("BANKFUL_USERNAME", "user");
    vi.stubEnv("BANKFUL_PASSWORD", "pass");

    const result = await verifyBankfulTransaction({
      orderId: "ord_1",
      transactionId: "tx_1",
      authenticatedCallback: {
        orderId: "ord_1",
        transactionId: "tx_1",
        status: "approved",
        amountCents: 1999,
        currency: "USD",
        rawStatus: "APPROVED",
      },
    });
    expect(result.verified).toBe(true);
    expect(result.status).toBe("approved");
    expect(result.amountCents).toBe(1999);
    expect(result.currency).toBe("USD");
  });

  it("queries Bankful when STATUS transaction type is configured", async () => {
    vi.stubEnv("BANKFUL_API_BASE_URL", "https://api-dev1.bankfulportal.com");
    vi.stubEnv("BANKFUL_USERNAME", "user");
    vi.stubEnv("BANKFUL_PASSWORD", "pass");
    // TODO(bankful-docs): confirm the real STATUS/query transaction_type with Bankful.
    vi.stubEnv("BANKFUL_STATUS_TRANSACTION_TYPE", "STATUS");

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        TRANS_STATUS_NAME: "APPROVED",
        TRANS_VALUE: "19.99",
        TRANS_CUR: "USD",
        XTL_ORDER_ID: "ord_1",
        TRANS_ORDER_ID: "tx_1",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyBankfulTransaction({
      orderId: "ord_1",
      transactionId: "tx_1",
    });
    expect(result.verified).toBe(true);
    expect(result.status).toBe("approved");
    expect(result.amountCents).toBe(1999);
    expect(fetchMock).toHaveBeenCalled();
    const body = String(fetchMock.mock.calls[0][1].body);
    expect(body).toContain("transaction_type=STATUS");
    expect(body).toContain("request_ref_po_id=tx_1");
  });

  it("rejects STATUS responses whose order id does not match", async () => {
    vi.stubEnv("BANKFUL_API_BASE_URL", "https://api-dev1.bankfulportal.com");
    vi.stubEnv("BANKFUL_USERNAME", "user");
    vi.stubEnv("BANKFUL_PASSWORD", "pass");
    vi.stubEnv("BANKFUL_STATUS_TRANSACTION_TYPE", "STATUS");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          TRANS_STATUS_NAME: "APPROVED",
          TRANS_VALUE: "19.99",
          TRANS_CUR: "USD",
          XTL_ORDER_ID: "other_order",
          TRANS_ORDER_ID: "tx_1",
        }),
      }),
    );

    const result = await verifyBankfulTransaction({
      orderId: "ord_1",
      transactionId: "tx_1",
    });
    expect(result.verified).toBe(false);
  });
});
