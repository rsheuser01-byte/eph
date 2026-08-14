import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ProductionConfigurationError,
  assertProductionCheckoutReady,
  assessProductionConfig,
  isProductionRuntime,
  publicCheckoutUnavailableMessage,
} from "./productionReadiness";

function stubProductionEnv(overrides: Record<string, string> = {}) {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
  vi.stubEnv("PAYMENT_PROVIDER", "stripe");
  vi.stubEnv("NEXT_PUBLIC_PAYMENT_PROVIDER", "stripe");
  vi.stubEnv("STRIPE_SECRET_KEY", "rk_test_123");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  vi.stubEnv("ORDER_STORE", "supabase");
  vi.stubEnv("ADMIN_TOKEN", "admin-token");
  vi.stubEnv("ADMIN_SESSION_SECRET", "session-secret");
  vi.stubEnv("EMAIL_PROVIDER", "resend");
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("EMAIL_FROM", "orders@example.com");
  vi.stubEnv("CRON_SECRET", "cron-secret");
  vi.stubEnv("TAX_PROVIDER", "taxjar");
  vi.stubEnv("TAXJAR_API_TOKEN", "tj_test");
  vi.stubEnv("TAX_FROM_STATE", "KY");
  vi.stubEnv("TAX_FROM_ZIP", "40202");
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "upstash-token");
  for (const [key, value] of Object.entries(overrides)) {
    vi.stubEnv(key, value);
  }
}

describe("productionReadiness", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("treats NODE_ENV=production as production runtime", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isProductionRuntime()).toBe(true);
  });

  it("opts out of production runtime when E2E_MODE=1", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("E2E_MODE", "1");
    expect(isProductionRuntime()).toBe(false);
  });

  it("does not require production config in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    const result = assessProductionConfig();
    expect(result.ok).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("passes when all required production settings are present", () => {
    stubProductionEnv();
    const result = assessProductionConfig();
    expect(result.ok).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("fails closed when payment provider is mock in production", () => {
    stubProductionEnv({ PAYMENT_PROVIDER: "mock" });
    const result = assessProductionConfig();
    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (i) => i.key === "PAYMENT_PROVIDER" && i.severity === "error",
      ),
    ).toBe(true);
  });

  it("fails closed when Bankful HPP is configured in production", async () => {
    stubProductionEnv({ PAYMENT_PROVIDER: "bankful-hpp" });
    const result = assessProductionConfig();
    expect(result.ok).toBe(false);
    expect(
      result.issues.some((i) => i.key === "PAYMENT_PROVIDER"),
    ).toBe(true);
  });

  it("fails closed when Supabase inventory is not configured", () => {
    stubProductionEnv({ SUPABASE_SERVICE_ROLE_KEY: "" });
    const result = assessProductionConfig();
    expect(result.ok).toBe(false);
    expect(
      result.issues.some((i) => i.key === "SUPABASE_SERVICE_ROLE_KEY"),
    ).toBe(true);
  });

  it("fails closed when ORDER_STORE is file in production", () => {
    stubProductionEnv({ ORDER_STORE: "file" });
    const result = assessProductionConfig();
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.key === "ORDER_STORE")).toBe(true);
  });

  it("fails closed when email is console in production", () => {
    stubProductionEnv({ EMAIL_PROVIDER: "console" });
    const result = assessProductionConfig();
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.key === "EMAIL_PROVIDER")).toBe(true);
  });

  it("assertProductionCheckoutReady throws a customer-safe error", () => {
    stubProductionEnv({ STRIPE_SECRET_KEY: "" });
    expect(() => assertProductionCheckoutReady()).toThrow(
      ProductionConfigurationError,
    );
    try {
      assertProductionCheckoutReady();
    } catch (error) {
      expect(error).toBeInstanceOf(ProductionConfigurationError);
      const typed = error as ProductionConfigurationError;
      expect(typed.message).toBe(publicCheckoutUnavailableMessage);
      expect(typed.issues.some((i) => i.key === "STRIPE_SECRET_KEY")).toBe(true);
    }
  });

  it("fails closed when tax provider is mock in production", () => {
    stubProductionEnv({ TAX_PROVIDER: "mock" });
    const result = assessProductionConfig();
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.key === "TAX_PROVIDER")).toBe(true);
  });

  it("fails closed when Upstash is missing in production", () => {
    stubProductionEnv({ UPSTASH_REDIS_REST_URL: "" });
    const result = assessProductionConfig();
    expect(result.ok).toBe(false);
    expect(
      result.issues.some((i) => i.key === "UPSTASH_REDIS_REST_URL"),
    ).toBe(true);
  });

  it("fails closed when Stripe webhook secret is missing", () => {
    stubProductionEnv({ STRIPE_WEBHOOK_SECRET: "" });
    const result = assessProductionConfig();
    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (i) => i.key === "STRIPE_WEBHOOK_SECRET" && i.severity === "error",
      ),
    ).toBe(true);
  });
});
