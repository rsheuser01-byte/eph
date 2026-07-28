import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  passwordsMatch,
  verifyAdminSessionToken,
} from "./session";

describe("admin session", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_TOKEN", "test-admin-secret");
    vi.stubEnv("ADMIN_SESSION_SECRET", "test-session-signing-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("exports a stable cookie name", () => {
    expect(ADMIN_SESSION_COOKIE).toBe("eph_admin_session");
  });

  it("creates a token that verifies with the same secret", async () => {
    const token = await createAdminSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    await expect(verifyAdminSessionToken(token)).resolves.toBe(true);
  });

  it("rejects a tampered token", async () => {
    const token = await createAdminSessionToken();
    const [payload, signature] = token.split(".");
    const tampered = `${payload}.${signature.slice(0, -1)}x`;
    await expect(verifyAdminSessionToken(tampered)).resolves.toBe(false);
  });

  it("rejects an empty or malformed token", async () => {
    await expect(verifyAdminSessionToken("")).resolves.toBe(false);
    await expect(verifyAdminSessionToken("not-a-token")).resolves.toBe(false);
    await expect(verifyAdminSessionToken("a.b.c")).resolves.toBe(false);
  });

  it("rejects an expired token", async () => {
    const token = await createAdminSessionToken({
      nowMs: Date.now() - 9 * 60 * 60 * 1000,
      ttlMs: 8 * 60 * 60 * 1000,
    });
    await expect(verifyAdminSessionToken(token)).resolves.toBe(false);
  });

  it("compares passwords in a timing-safe way", async () => {
    await expect(passwordsMatch("test-admin-secret", "test-admin-secret")).resolves.toBe(
      true,
    );
    await expect(passwordsMatch("test-admin-secret", "wrong")).resolves.toBe(
      false,
    );
    await expect(passwordsMatch("", "test-admin-secret")).resolves.toBe(false);
  });

  it("fails closed when ADMIN_TOKEN is unset", async () => {
    vi.stubEnv("ADMIN_TOKEN", "");
    await expect(createAdminSessionToken()).rejects.toThrow(/ADMIN_TOKEN/);
    await expect(verifyAdminSessionToken("anything")).resolves.toBe(false);
  });
});
