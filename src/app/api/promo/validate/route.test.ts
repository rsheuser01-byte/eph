import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetMemoryRateLimits } from "@/lib/security/rateLimit";

const hasApprovedOrderForEmail = vi.fn(async () => false);

vi.mock("@/lib/orders", () => ({
  getOrderStore: () => ({
    name: "mock",
    hasApprovedOrderForEmail,
    save: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
  }),
}));

const upsertPromo = vi.fn();
const getByCode = vi.fn();

vi.mock("@/lib/promo", async () => {
  const actual = await vi.importActual<typeof import("@/lib/promo")>("@/lib/promo");
  return {
    ...actual,
    getPromoStore: () => ({
      name: "mock",
      getByCode,
      upsert: upsertPromo,
    }),
  };
});

describe("POST /api/promo/validate", () => {
  beforeEach(() => {
    resetMemoryRateLimits();
    hasApprovedOrderForEmail.mockReset();
    hasApprovedOrderForEmail.mockResolvedValue(false);
    getByCode.mockReset();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns discount for a valid fixture code", async () => {
    getByCode.mockResolvedValue({
      code: "SAVE20",
      percentOff: 20,
      active: true,
      firstOrderOnly: false,
      label: "20% off",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: "save20",
          items: [{ slug: "glp-3", size: "10mg", qty: 1 }],
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      promoCode: string;
      discount: number;
      label: string;
    };
    expect(body.promoCode).toBe("SAVE20");
    expect(body.label).toBe("20% off");
    expect(body.discount).toBeGreaterThan(0);
  });

  it("rejects unknown codes", async () => {
    getByCode.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: "NOPE",
          items: [{ slug: "glp-3", size: "10mg", qty: 1 }],
        }),
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toMatch(/invalid/i);
  });

  it("rejects first-order codes when email already ordered", async () => {
    getByCode.mockResolvedValue({
      code: "FIRST20",
      percentOff: 20,
      active: true,
      firstOrderOnly: true,
      label: "First order 20%",
    });
    hasApprovedOrderForEmail.mockResolvedValue(true);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: "FIRST20",
          email: "ada@example.com",
          items: [{ slug: "glp-3", size: "10mg", qty: 1 }],
        }),
      }),
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toMatch(/first order/i);
  });
});
