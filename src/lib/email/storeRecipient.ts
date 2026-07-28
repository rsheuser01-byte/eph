import { site } from "@/data/site";

/** Prefer STORE_NOTIFICATION_EMAIL when set; otherwise site contact email. */
export function storeNotificationEmail(): string {
  const fromEnv = process.env.STORE_NOTIFICATION_EMAIL?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : site.email;
}
