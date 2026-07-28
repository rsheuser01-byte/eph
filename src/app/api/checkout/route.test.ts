import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ProductionConfigurationError,
  publicCheckoutUnavailableMessage,
} from "@/lib/config/productionReadiness";

describe("POST /api/checkout production gate", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
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
});
