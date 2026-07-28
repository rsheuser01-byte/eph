import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as health } from "../health/route";
import { GET as readiness } from "./route";

describe("GET /api/health", () => {
  it("returns ok without auth", async () => {
    const response = await health();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true });
  });
});

describe("GET /api/readiness", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a minimal public payload", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const response = await readiness(
      new Request("http://localhost/api/readiness"),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toEqual({ ready: true });
    expect(body.checks).toBeUndefined();
  });

  it("includes diagnostics when authorized", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("CRON_SECRET", "ready-secret");
    const response = await readiness(
      new Request("http://localhost/api/readiness", {
        headers: { Authorization: "Bearer ready-secret" },
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      ready: boolean;
      checks: unknown[];
    };
    expect(body.ready).toBe(true);
    expect(Array.isArray(body.checks)).toBe(true);
  });

  it("reports not ready in production without required config", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PAYMENT_PROVIDER", "mock");
    vi.stubEnv("CRON_SECRET", "ready-secret");
    // Clear other production deps so assessment fails.
    vi.stubEnv("BANKFUL_PASSWORD", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    const response = await readiness(
      new Request("http://localhost/api/readiness", {
        headers: { Authorization: "Bearer ready-secret" },
      }),
    );
    expect(response.status).toBe(503);
    const body = (await response.json()) as { ready: boolean };
    expect(body.ready).toBe(false);
  });
});
