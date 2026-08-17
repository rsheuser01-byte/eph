import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextResponse } from "next/server";
import { resetMemoryRateLimits } from "@/lib/security/rateLimit";
import { CART_SESSION_COOKIE } from "@/lib/abandonedCart/cookie";

const upsertSavedCart = vi.fn();
const identifySavedCart = vi.fn();
const restoreSavedCart = vi.fn();
const getAbandonedCartStatus = vi.fn();
const getAbandonedCartEmailData = vi.fn();

vi.mock("@/lib/abandonedCart/service", () => ({
  upsertSavedCart: (...args: unknown[]) => upsertSavedCart(...args),
  identifySavedCart: (...args: unknown[]) => identifySavedCart(...args),
  restoreSavedCart: (...args: unknown[]) => restoreSavedCart(...args),
  getAbandonedCartStatus: (...args: unknown[]) => getAbandonedCartStatus(...args),
  getAbandonedCartEmailData: (...args: unknown[]) =>
    getAbandonedCartEmailData(...args),
}));

describe("abandoned-cart API routes", () => {
  beforeEach(() => {
    resetMemoryRateLimits();
    upsertSavedCart.mockReset().mockResolvedValue({
      cart: { publicId: "pub" },
      sessionToken: "session-token",
      webhookSent: false,
    });
    identifySavedCart.mockReset().mockResolvedValue({
      cart: { publicId: "pub" },
      sessionToken: "session-token",
      webhookSent: true,
    });
    restoreSavedCart.mockReset();
    getAbandonedCartStatus.mockReset();
    getAbandonedCartEmailData.mockReset();
    vi.stubEnv("ACTIVEPIECES_CART_API_SECRET", "cart-secret");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.elevateprecisionhealth.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("syncs cart items and sets the session cookie", async () => {
    const { POST } = await import("@/app/api/abandoned-cart/route");
    const response = (await POST(
      new Request("http://localhost/api/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ slug: "glp-3", size: "15mg", qty: 1 }],
        }),
      }),
    )) as NextResponse;
    expect(response.status).toBe(200);
    expect(upsertSavedCart).toHaveBeenCalled();
    expect(response.cookies.get(CART_SESSION_COOKIE)?.value).toBe(
      "session-token",
    );
    expect(response.cookies.get(CART_SESSION_COOKIE)?.httpOnly).toBe(true);
  });

  it("rejects invalid identify emails without calling the service", async () => {
    const { POST } = await import("@/app/api/abandoned-cart/identify/route");
    const response = await POST(
      new Request("http://localhost/api/abandoned-cart/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-valid" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(identifySavedCart).not.toHaveBeenCalled();
  });

  it("identifies a valid email", async () => {
    const { POST } = await import("@/app/api/abandoned-cart/identify/route");
    const response = await POST(
      new Request("http://localhost/api/abandoned-cart/identify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${CART_SESSION_COOKIE}=session-token`,
        },
        body: JSON.stringify({
          email: "ada@example.com",
          firstName: "Ada",
          items: [{ slug: "glp-3", size: "15mg", qty: 1 }],
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(identifySavedCart).toHaveBeenCalledWith(
      "session-token",
      "ada@example.com",
      "Ada",
      [{ slug: "glp-3", size: "15mg", qty: 1 }],
    );
  });

  it("rejects unauthenticated Activepieces status requests", async () => {
    const { GET } = await import(
      "@/app/api/abandoned-cart/[publicId]/status/route"
    );
    const response = await GET(
      new Request("http://localhost/api/abandoned-cart/pub/status"),
      { params: Promise.resolve({ publicId: "pub" }) },
    );
    expect(response.status).toBe(401);
    expect(getAbandonedCartStatus).not.toHaveBeenCalled();
  });

  it("returns status for an authenticated Activepieces request", async () => {
    getAbandonedCartStatus.mockResolvedValue({
      status: "active",
      converted: false,
      expired: false,
      canEmail: true,
    });
    const { GET } = await import(
      "@/app/api/abandoned-cart/[publicId]/status/route"
    );
    const response = await GET(
      new Request("http://localhost/api/abandoned-cart/pub/status", {
        headers: { Authorization: "Bearer cart-secret" },
      }),
      { params: Promise.resolve({ publicId: "pub" }) },
    );
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({
      status: "active",
      converted: false,
      expired: false,
      canEmail: true,
    });
    expect(JSON.stringify(payload)).not.toContain("@");
  });

  it("rejects unauthenticated cart data requests", async () => {
    const { GET } = await import("@/app/api/abandoned-cart/[publicId]/route");
    const response = await GET(
      new Request("http://localhost/api/abandoned-cart/pub"),
      { params: Promise.resolve({ publicId: "pub" }) },
    );
    expect(response.status).toBe(401);
    expect(getAbandonedCartEmailData).not.toHaveBeenCalled();
  });

  it("restores lines for a valid token", async () => {
    restoreSavedCart.mockResolvedValue({
      ok: true,
      lines: [{ slug: "glp-3", size: "15mg", qty: 1 }],
      droppedCount: 0,
      sessionToken: "restored-session",
    });
    const { POST } = await import("@/app/api/abandoned-cart/restore/route");
    const response = (await POST(
      new Request("http://localhost/api/abandoned-cart/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "opaque-token" }),
      }),
    )) as NextResponse;
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      lines: [{ slug: "glp-3", size: "15mg", qty: 1 }],
      droppedCount: 0,
    });
    expect(response.cookies.get(CART_SESSION_COOKIE)?.value).toBe(
      "restored-session",
    );
  });
});
