import { site } from "@/data/site";

const REQUIRED_STORE_RECIPIENTS = [
  "rsheuser01@gmail.com",
  "support@elevateprecisionhealth.com",
] as const;

/**
 * Returns the list of store notification recipients for paid order emails.
 * Always includes both required addresses (rsheuser01@gmail.com and
 * support@elevateprecisionhealth.com). If STORE_NOTIFICATION_EMAIL is set
 * and different, it's included as well. Duplicates are removed.
 */
export function storeNotificationRecipients(): string[] {
  const recipients = new Set<string>(REQUIRED_STORE_RECIPIENTS);
  const fromEnv = process.env.STORE_NOTIFICATION_EMAIL?.trim().toLowerCase();
  if (fromEnv && fromEnv.length > 0) {
    recipients.add(fromEnv);
  }
  return Array.from(recipients);
}

/**
 * Returns a single store notification email address for alerts and
 * non-order-paid notifications. Prefer STORE_NOTIFICATION_EMAIL when set;
 * otherwise site contact email.
 */
export function storeNotificationEmail(): string {
  const fromEnv = process.env.STORE_NOTIFICATION_EMAIL?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : site.email;
}
