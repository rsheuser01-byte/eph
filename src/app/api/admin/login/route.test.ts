import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin/session";
import { resetMemoryRateLimits } from "@/lib/security/rateLimit";
import { POST as login } from "./route";

describe("POST /api/admin/login", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_TOKEN", "correct-password");
    vi.stubEnv("ADMIN_SESSION_SECRET", "signing-secret");
    resetMemoryRateLimits();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects wrong passwords without setting a session cookie", async () => {
    const response = (await login(
      new Request("http://localhost/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "wrong" }),
      }),
    )) as NextResponse;
    expect(response.status).toBe(401);
    expect(response.cookies.get(ADMIN_SESSION_COOKIE)).toBeUndefined();
  });

  it("sets an httpOnly session cookie on success", async () => {
    const response = (await login(
      new Request("http://localhost/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "correct-password" }),
      }),
    )) as NextResponse;
    expect(response.status).toBe(200);
    const cookie = response.cookies.get(ADMIN_SESSION_COOKIE);
    expect(cookie?.value).toBeTruthy();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("strict");
  });

  it("returns 503 when ADMIN_TOKEN is unset", async () => {
    vi.stubEnv("ADMIN_TOKEN", "");
    const response = await login(
      new Request("http://localhost/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "anything" }),
      }),
    );
    expect(response.status).toBe(503);
  });
});
