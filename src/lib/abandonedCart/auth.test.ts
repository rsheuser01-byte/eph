import { afterEach, describe, expect, it, vi } from "vitest";
import { authorizeAbandonedCartApi } from "./auth";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("authorizeAbandonedCartApi", () => {
  it("rejects requests when the secret is missing", () => {
    vi.stubEnv("ACTIVEPIECES_CART_API_SECRET", "");
    const request = new Request("http://localhost/api/abandoned-cart/x", {
      headers: { Authorization: "Bearer x" },
    });
    expect(authorizeAbandonedCartApi(request)).toBe(false);
  });

  it("rejects missing or wrong bearer tokens", () => {
    vi.stubEnv("ACTIVEPIECES_CART_API_SECRET", "super-secret");
    expect(
      authorizeAbandonedCartApi(
        new Request("http://localhost/api/abandoned-cart/x"),
      ),
    ).toBe(false);
    expect(
      authorizeAbandonedCartApi(
        new Request("http://localhost/api/abandoned-cart/x", {
          headers: { Authorization: "Bearer other" },
        }),
      ),
    ).toBe(false);
  });

  it("accepts the configured bearer secret", () => {
    vi.stubEnv("ACTIVEPIECES_CART_API_SECRET", "super-secret");
    expect(
      authorizeAbandonedCartApi(
        new Request("http://localhost/api/abandoned-cart/x", {
          headers: { Authorization: "Bearer super-secret" },
        }),
      ),
    ).toBe(true);
  });
});
