import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_TRUSTPILOT_INVITE_KEY,
  getTrustpilotInviteKey,
  isTrustpilotInviteEnabled,
  isValidTrustpilotInviteKey,
  TRUSTPILOT_INVITE_SCRIPT_URL,
} from "./config";

describe("Trustpilot invitation config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the Business integration key Trustpilot issued for this site", () => {
    expect(DEFAULT_TRUSTPILOT_INVITE_KEY).toBe("jZ3C9TiKXWvbgpiv");
    expect(isValidTrustpilotInviteKey(DEFAULT_TRUSTPILOT_INVITE_KEY)).toBe(
      true,
    );
    expect(TRUSTPILOT_INVITE_SCRIPT_URL).toBe(
      "https://invitejs.trustpilot.com/tp.min.js",
    );
  });

  it("enables invitations with the issued key when env is unset", () => {
    vi.stubEnv("E2E_MODE", "");
    vi.stubEnv("NEXT_PUBLIC_TRUSTPILOT_INVITE_KEY", "");
    // Unset rather than empty: empty string is an explicit disable.
    delete process.env.NEXT_PUBLIC_TRUSTPILOT_INVITE_KEY;
    delete process.env.E2E_MODE;

    expect(getTrustpilotInviteKey()).toBe(DEFAULT_TRUSTPILOT_INVITE_KEY);
    expect(isTrustpilotInviteEnabled()).toBe(true);
  });

  it("lets env override or disable the integration key", () => {
    vi.stubEnv("E2E_MODE", "");
    delete process.env.E2E_MODE;

    vi.stubEnv("NEXT_PUBLIC_TRUSTPILOT_INVITE_KEY", "CustomKey123");
    expect(getTrustpilotInviteKey()).toBe("CustomKey123");

    vi.stubEnv("NEXT_PUBLIC_TRUSTPILOT_INVITE_KEY", "off");
    expect(getTrustpilotInviteKey()).toBe("");
    expect(isTrustpilotInviteEnabled()).toBe(false);
  });

  it("stays off during Playwright E2E so tests do not call Trustpilot", () => {
    vi.stubEnv("E2E_MODE", "1");
    expect(getTrustpilotInviteKey()).toBe("");
    expect(isTrustpilotInviteEnabled()).toBe(false);
  });

  it("rejects keys that could break out of the bootstrap snippet", () => {
    expect(isValidTrustpilotInviteKey("abc;alert(1)")).toBe(false);
    expect(isValidTrustpilotInviteKey("")).toBe(false);
  });
});
