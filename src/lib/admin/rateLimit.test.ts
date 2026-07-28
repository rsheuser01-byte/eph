import { afterEach, describe, expect, it } from "vitest";
import { allowAttempt, resetRateLimits } from "./rateLimit";

describe("admin login rate limit", () => {
  afterEach(() => {
    resetRateLimits();
  });

  it("allows attempts under the limit", () => {
    expect(allowAttempt("ip:1", 3, 60_000, 1_000)).toBe(true);
    expect(allowAttempt("ip:1", 3, 60_000, 1_001)).toBe(true);
    expect(allowAttempt("ip:1", 3, 60_000, 1_002)).toBe(true);
  });

  it("blocks attempts over the limit within the window", () => {
    allowAttempt("ip:2", 2, 60_000, 1_000);
    allowAttempt("ip:2", 2, 60_000, 1_001);
    expect(allowAttempt("ip:2", 2, 60_000, 1_002)).toBe(false);
  });

  it("resets after the window expires", () => {
    allowAttempt("ip:3", 1, 1_000, 1_000);
    expect(allowAttempt("ip:3", 1, 1_000, 1_500)).toBe(false);
    expect(allowAttempt("ip:3", 1, 1_000, 2_001)).toBe(true);
  });
});
