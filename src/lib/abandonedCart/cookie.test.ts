import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CART_SESSION_COOKIE,
  getCartSessionCookieOptions,
  readCartSessionToken,
} from "./cookie";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cart session cookie", () => {
  it("is httpOnly with SameSite=Lax and does not include email", () => {
    vi.stubEnv("NODE_ENV", "production");
    const options = getCartSessionCookieOptions();
    expect(CART_SESSION_COOKIE).toBe("eph_cart_sid");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.secure).toBe(true);
    expect(options.path).toBe("/");
    expect(JSON.stringify(options)).not.toContain("@");
  });

  it("reads the session token from the Cookie header", () => {
    const request = new Request("http://localhost/api/abandoned-cart", {
      headers: { cookie: `${CART_SESSION_COOKIE}=abc123; other=1` },
    });
    expect(readCartSessionToken(request)).toBe("abc123");
  });
});
