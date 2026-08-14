import { describe, expect, it, vi, afterEach } from "vitest";
import { quoteTax } from "./index";
import { createTaxJarProvider } from "./taxjar";
import type { TaxQuoteInput } from "./types";

const sampleInput: TaxQuoteInput = {
  customer: {
    country: "US",
    state: "KY",
    city: "Louisville",
    zip: "40202",
    address1: "1 Main St",
  },
  items: [{ sku: "SKU1", quantity: 1, unitPrice: 100 }],
  shipping: 12,
};

describe("mock tax provider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns zero tax with provider mock", async () => {
    vi.stubEnv("TAX_PROVIDER", "mock");
    const quote = await quoteTax(sampleInput);
    expect(quote.amount).toBe(0);
    expect(quote.provider).toBe("mock");
  });

  it("returns zero tax with provider mock in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TAX_PROVIDER", "mock");
    const quote = await quoteTax(sampleInput);
    expect(quote.amount).toBe(0);
    expect(quote.provider).toBe("mock");
  });
});

describe("taxjar provider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("maps TaxJar amount_to_collect into a TaxQuote", async () => {
    vi.stubEnv("TAXJAR_API_TOKEN", "test-token");
    vi.stubEnv("TAX_FROM_COUNTRY", "US");
    vi.stubEnv("TAX_FROM_STATE", "KY");
    vi.stubEnv("TAX_FROM_ZIP", "40202");
    vi.stubEnv("TAX_FROM_CITY", "Louisville");
    vi.stubEnv("TAX_FROM_STREET", "100 Warehouse Rd");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tax: {
          amount_to_collect: 6.12,
          rate: 0.06,
          freight_taxable: true,
          jurisdictions: {
            country: "US",
            state: "KY",
            county: "JEFFERSON",
            city: "LOUISVILLE",
          },
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = createTaxJarProvider();
    const quote = await provider.quote(sampleInput);

    expect(quote.amount).toBe(6.12);
    expect(quote.provider).toBe("taxjar");
    expect(quote.jurisdiction).toContain("KY");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({
      Authorization: "Bearer test-token",
    });
    const body = JSON.parse(String(init.body)) as {
      to_state: string;
      shipping: number;
      amount: number;
    };
    expect(body.to_state).toBe("KY");
    expect(body.shipping).toBe(12);
    expect(body.amount).toBe(100);
  });

  it("throws a safe error when TaxJar fails", async () => {
    vi.stubEnv("TAXJAR_API_TOKEN", "test-token");
    vi.stubEnv("TAX_FROM_COUNTRY", "US");
    vi.stubEnv("TAX_FROM_STATE", "KY");
    vi.stubEnv("TAX_FROM_ZIP", "40202");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "upstream error",
      }),
    );

    const provider = createTaxJarProvider();
    await expect(provider.quote(sampleInput)).rejects.toThrow(
      /tax calculation unavailable/i,
    );
  });
});
