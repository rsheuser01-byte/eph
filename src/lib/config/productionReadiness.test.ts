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
  vi.stubEnv("PAYMENT_PROVIDER", "bankful-hpp");
  vi.stubEnv("NEXT_PUBLIC_PAYMENT_PROVIDER", "bankful-hpp");
  vi.stubEnv("BANKFUL_API_BASE_URL", "https://api.paybybankful.com");
  vi.stubEnv("BANKFUL_USERNAME", "user");
  vi.stubEnv("BANKFUL_PASSWORD", "pass");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://proj.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  vi.stubEnv("ORDER_STORE", "supabase");
  vi.stubEnv("ADMIN_TOKEN", "admin-token");
  vi.stubEnv("ADMIN_SESSION_SECRET", "session-secret");
  vi.stubEnv("EMAIL_PROVIDER", "resend");
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("EMAIL_FROM", "orders@example.com");
  vi.stubEnv("CRON_SECRET", "cron-secret");
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

  it("fails closed when direct bankful card capture is configured", () => {
    stubProductionEnv({ PAYMENT_PROVIDER: "bankful" });
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
    stubProductionEnv({ BANKFUL_PASSWORD: "" });
    expect(() => assertProductionCheckoutReady()).toThrow(
      ProductionConfigurationError,
    );
    try {
      assertProductionCheckoutReady();
    } catch (error) {
      expect(error).toBeInstanceOf(ProductionConfigurationError);
      const typed = error as ProductionConfigurationError;
      expect(typed.message).toBe(publicCheckoutUnavailableMessage);
      expect(typed.issues.some((i) => i.key === "BANKFUL_PASSWORD")).toBe(true);
    }
  });

  it("warns when STATUS lookup is unset but does not block checkout", () => {
    stubProductionEnv({ BANKFUL_STATUS_TRANSACTION_TYPE: "" });
    const result = assessProductionConfig();
    expect(result.ok).toBe(true);
    expect(
      result.issues.some(
        (i) =>
          i.key === "BANKFUL_STATUS_TRANSACTION_TYPE" &&
          i.severity === "warning",
      ),
    ).toBe(true);
  });
});
