/**
 * Write a local browser preview of the newsletter welcome email.
 * Usage: npm run preview:welcome-email
 */
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { getEmailLogoUrl } from "../src/lib/email/emailLayout";
import { buildWelcomeEmail } from "../src/lib/email/marketing/welcomeEmail";

const PREVIEW_UNSUBSCRIBE = "https://example.com/unsubscribe-preview";

const message = buildWelcomeEmail({
  firstName: "Robert",
  unsubscribeUrl: PREVIEW_UNSUBSCRIBE,
});

const outDir = resolve("tmp");
mkdirSync(outDir, { recursive: true });

const htmlPath = resolve(outDir, "sample-welcome-email.html");
const textPath = resolve(outDir, "sample-welcome-email.txt");

// Offline-friendly logo for local browser preview (same approach as order email)
const previewHtml = message.html.replaceAll(
  getEmailLogoUrl(),
  "../public/images/logo.png",
);

writeFileSync(htmlPath, previewHtml, "utf8");
writeFileSync(textPath, message.text, "utf8");

console.log(`Subject: ${message.subject}`);
console.log(`Preview HTML: ${htmlPath}`);
console.log(`Preview text: ${textPath}`);
