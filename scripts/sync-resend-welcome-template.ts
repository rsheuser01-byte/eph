/**
 * Create or update + publish the Resend welcome newsletter template.
 *
 * Requires:
 *   RESEND_API_KEY
 *   MARKETING_EMAIL_FROM
 * Optional:
 *   EMAIL_REPLY_TO
 *
 * Usage: npm run sync:resend-welcome
 */
import { Resend } from "resend";
import {
  syncWelcomeTemplate,
  type ResendTemplatesClient,
} from "../src/lib/email/marketing/syncWelcomeTemplate";

async function main(): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required.");
  }

  const resend = new Resend(apiKey);
  const templates = resend.templates as unknown as ResendTemplatesClient;
  const result = await syncWelcomeTemplate(templates);

  console.log(`action=${result.action}`);
  console.log(`templateId=${result.templateId}`);
  console.log(`alias=${result.alias}`);
  console.log(`published=${result.published}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Sync failed";
  console.error(message);
  process.exitCode = 1;
});
