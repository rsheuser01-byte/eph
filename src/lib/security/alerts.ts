import { site } from "@/data/site";
import { getEmailProvider } from "@/lib/email";
import { storeNotificationEmail } from "@/lib/email/storeRecipient";

export type CriticalAlertEvent =
  | "ipn.signature_failure"
  | "ipn.amount_mismatch"
  | "checkout.persistence_failure"
  | "outbox.retry_exhausted"
  | "inventory.rpc_failure"
  | "checkout.error_spike"
  | "cron.failure"
  | "config.failure";

const recentAlerts = new Map<string, number>();
const ALERT_COOLDOWN_MS = 5 * 60_000;

/**
 * Record a critical operational alert: structured log, optional Sentry, email
 * (cooldown per event type to avoid storms).
 */
export async function alertCritical(
  event: CriticalAlertEvent,
  detail: Record<string, unknown> = {},
): Promise<void> {
  console.error(`[alert] ${event}`, detail);

  const sentryDsn = process.env.SENTRY_DSN?.trim();
  if (sentryDsn) {
    try {
      await sendSentryEvent(sentryDsn, event, detail);
    } catch (error) {
      console.error("[alert] Sentry emit failed", error);
    }
  }

  const now = Date.now();
  const last = recentAlerts.get(event) ?? 0;
  if (now - last < ALERT_COOLDOWN_MS) {
    return;
  }
  recentAlerts.set(event, now);

  try {
    await getEmailProvider().send({
      to: storeNotificationEmail(),
      subject: `[${site.name}] Alert: ${event}`,
      text: `Critical event: ${event}\n\n${JSON.stringify(detail, null, 2)}\n`,
      html: `<p>Critical event: <code>${event}</code></p><pre>${escapeHtml(
        JSON.stringify(detail, null, 2),
      )}</pre>`,
    });
  } catch (error) {
    console.error("[alert] email failed", error);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Minimal Sentry store API emit (no full SDK required). */
async function sendSentryEvent(
  dsn: string,
  event: string,
  detail: Record<string, unknown>,
): Promise<void> {
  const parsed = new URL(dsn);
  const publicKey = parsed.username;
  const projectId = parsed.pathname.replace(/^\//, "");
  if (!publicKey || !projectId) {
    return;
  }
  const ingest = `${parsed.protocol}//${parsed.host}/api/${projectId}/store/`;
  await fetch(ingest, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${publicKey}`,
    },
    body: JSON.stringify({
      message: event,
      level: "error",
      platform: "node",
      tags: { event },
      extra: detail,
      timestamp: Date.now() / 1000,
    }),
  });
}

/** Test helper. */
export function resetAlertCooldowns(): void {
  recentAlerts.clear();
}
