import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ProductionConfigurationError,
  publicCheckoutUnavailableMessage,
} from "@/lib/config/productionReadiness";

describe("POST /api/checkout production gate", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns 503 with a customer-safe message when production config is incomplete", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [] }),
      }),
    );

    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe(publicCheckoutUnavailableMessage);
    expect(body.error).not.toMatch(/PAYMENT_PROVIDER|mock/i);
  });

  it("exposes ProductionConfigurationError for logging paths", () => {
    const error = new ProductionConfigurationError([
      {
        key: "PAYMENT_PROVIDER",
        message: "bad",
        severity: "error",
      },
    ]);
    expect(error.message).toBe(publicCheckoutUnavailableMessage);
    expect(error.issues[0]?.key).toBe("PAYMENT_PROVIDER");
  });

  it("rejects checkout without research-use acknowledgment", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ slug: "glp-3", size: "10mg", qty: 1 }],
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
        }),
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toMatch(/acknowledgment/i);
  });

  it("rejects an unverified shipping address when Google is configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            verdict: {
              addressComplete: false,
              validationGranularity: "OTHER",
            },
            address: {
              formattedAddress: "nowhere",
              postalAddress: {
                regionCode: "US",
                locality: "X",
                administrativeArea: "KY",
                postalCode: "00000",
                addressLines: ["asdf"],
              },
            },
          },
        }),
      }),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ slug: "glp-3", size: "10mg", qty: 1 }],
          researchUseAcknowledged: true,
          customer: {
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@example.com",
            address1: "asdf",
            city: "Nope",
            state: "KY",
            zip: "00000",
            country: "US",
          },
        }),
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toMatch(/couldn't verify/i);
  });
});
