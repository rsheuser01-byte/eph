import { normalizeEmail } from "./email";

/**
 * Mask an email for admin UI and logs. Never log the full address.
 * `robert@example.com` → `r***@example.com`
 */
export function maskEmail(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const email = normalizeEmail(value);
  const at = email.indexOf("@");
  if (at < 1) {
    return "***";
  }
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}
