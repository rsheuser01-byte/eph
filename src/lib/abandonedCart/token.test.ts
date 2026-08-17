import { describe, expect, it } from "vitest";
import {
  generateOpaqueToken,
  generatePublicId,
  generateRestoreToken,
  generateSessionToken,
  hashToken,
  tokensMatch,
} from "./token";

describe("abandoned cart tokens", () => {
  it("generates opaque base64url tokens with high entropy", () => {
    const token = generateRestoreToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(generateSessionToken()).not.toBe(token);
    expect(generatePublicId()).not.toBe(token);
    expect(generateOpaqueToken(32)).not.toBe(token);
  });

  it("hashes tokens as hex sha256", () => {
    const hash = hashToken("abc");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken("abc")).toBe(hash);
    expect(hashToken("abd")).not.toBe(hash);
  });

  it("compares tokens in constant time", () => {
    expect(tokensMatch("secret", "secret")).toBe(true);
    expect(tokensMatch("secret", "Secret")).toBe(false);
    expect(tokensMatch("secret", "sec")).toBe(false);
    expect(tokensMatch("", "secret")).toBe(false);
    expect(tokensMatch(null, "secret")).toBe(false);
  });

  it("does not put email or database ids in tokens", () => {
    const token = generateRestoreToken();
    expect(token).not.toContain("@");
    expect(token.toLowerCase()).not.toContain("eph-");
  });
});
