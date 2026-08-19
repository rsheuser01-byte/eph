export const TRUSTPILOT_INVITE_SCRIPT_URL =
  "https://invitejs.trustpilot.com/tp.min.js";

/** Public Trustpilot JavaScript integration key issued for this storefront. */
export const DEFAULT_TRUSTPILOT_INVITE_KEY = "jZ3C9TiKXWvbgpiv";

export function isValidTrustpilotInviteKey(key: string): boolean {
  return /^[A-Za-z0-9_-]{8,64}$/.test(key);
}

/**
 * Invitation key loaded in the browser.
 * Unset env uses the issued key. Set `NEXT_PUBLIC_TRUSTPILOT_INVITE_KEY=off`
 * to disable. Playwright sets `E2E_MODE=1` so tests never call Trustpilot.
 */
export function getTrustpilotInviteKey(): string {
  if (process.env.E2E_MODE === "1") {
    return "";
  }

  const fromEnv = process.env.NEXT_PUBLIC_TRUSTPILOT_INVITE_KEY;
  if (fromEnv !== undefined) {
    const trimmed = fromEnv.trim();
    if (!trimmed || trimmed.toLowerCase() === "off") {
      return "";
    }
    return isValidTrustpilotInviteKey(trimmed) ? trimmed : "";
  }

  return DEFAULT_TRUSTPILOT_INVITE_KEY;
}

export function isTrustpilotInviteEnabled(): boolean {
  return getTrustpilotInviteKey().length > 0;
}
