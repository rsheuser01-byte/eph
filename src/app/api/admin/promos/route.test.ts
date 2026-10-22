import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetMemoryRateLimits } from "@/lib/security/rateLimit";
import type { PromoCode } from "@/lib/promo/types";

const assertAdminApiSession = vi.fn();
const writeAuditLog = vi.fn();
const promos = new Map<string, PromoCode>();

vi.mock("@/lib/admin/auth", () => ({
  assertAdminApiSession: () => assertAdminApiSession(),
}));

vi.mock("@/lib/security/audit", () => ({
  writeAuditLog: (...args: unknown[]) => writeAuditLog(...args),
}));

vi.mock("@/lib/promo", () => ({
  getPromoStore: () => ({
    name: "memory",
    getByCode: async (code: string) => promos.get(code.trim().toUpperCase()) ?? null,
    list: async () => [...promos.values()],
    upsert: async (promo: PromoCode) => {
      promos.set(promo.code, promo);
    },
  }),
}));

describe("POST /api/admin/promos", () => {
  beforeEach(() => {
    resetMemoryRateLimits();
    promos.clear();
    assertAdminApiSession.mockReset();
    assertAdminApiSession.mockResolvedValue(true);
    writeAuditLog.mockReset();
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects a signed-out request", async () => {
    assertAdminApiSession.mockResolvedValue(false);
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "ELEVATE25", percentOff: 25 }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("saves a percent code with a window", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "fall25",
          percentOff: 25,
          startsAt: "2026-10-01T00:00:00.000Z",
          endsAt: "2026-11-01T00:00:00.000Z",
        }),
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { promo: PromoCode };
    expect(body.promo.code).toBe("FALL25");
    expect(body.promo.percentOff).toBe(25);
    expect(body.promo.endsAt).toBe("2026-11-01T00:00:00.000Z");
    expect(writeAuditLog).toHaveBeenCalled();
  });

  it("cancels an existing code", async () => {
    promos.set("ELEVATE25", {
      code: "ELEVATE25",
      percentOff: 25,
      active: true,
      firstOrderOnly: false,
      label: "25% off",
    });
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set-active",
          code: "ELEVATE25",
          active: false,
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(promos.get("ELEVATE25")?.active).toBe(false);
  });
});
