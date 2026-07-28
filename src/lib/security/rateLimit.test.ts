import { describe, expect, it, vi, afterEach } from "vitest";
import {
  checkRateLimit,
  clientIpFromRequest,
  resetMemoryRateLimits,
} from "./rateLimit";

describe("clientIpFromRequest", () => {
  it("uses the first x-forwarded-for hop", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientIpFromRequest(request)).toBe("1.2.3.4");
  });

  it("falls back to unknown", () => {
    expect(clientIpFromRequest(new Request("http://localhost"))).toBe(
      "unknown",
    );
  });
});

describe("checkRateLimit memory backend", () => {
  afterEach(() => {
    resetMemoryRateLimits();
    vi.unstubAllEnvs();
  });

  it("allows up to the limit then blocks", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const key = "test:checkout:ip";
    expect(
      (await checkRateLimit("checkout", key, { limit: 2, windowMs: 60_000 }))
        .allowed,
    ).toBe(true);
    expect(
      (await checkRateLimit("checkout", key, { limit: 2, windowMs: 60_000 }))
        .allowed,
    ).toBe(true);
    expect(
      (await checkRateLimit("checkout", key, { limit: 2, windowMs: 60_000 }))
        .allowed,
    ).toBe(false);
  });
});
