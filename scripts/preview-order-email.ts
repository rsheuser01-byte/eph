/**
 * One-off: write a sample order confirmation preview (HTML + text).
 * Usage: npx tsx scripts/preview-order-email.ts
 *
 * Optional send via Resend:
 *   EMAIL_PROVIDER=resend RESEND_API_KEY=... EMAIL_FROM=... npx tsx scripts/preview-order-email.ts --send
 */
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { buildCustomerConfirmation } from "../src/lib/email/orderConfirmation";
import { getEmailProvider } from "../src/lib/email";
import { getEmailLogoUrl } from "../src/lib/email/emailLayout";

const TO = process.env.SAMPLE_EMAIL_TO?.trim() || "rsheuser01@gmail.com";
const shouldSend = process.argv.includes("--send");

const message = buildCustomerConfirmation({
  orderId: "EPH-SAMPLE-001",
  items: [
    {
      sku: "GLP-3-15MG",
      name: "GLP-3",
      size: "15mg",
      qty: 2,
      unitPrice: 69.99,
    },
    {
      sku: "NAD-100MG",
      name: "NAD+",
      size: "100mg",
      qty: 1,
      unitPrice: 49.99,
    },
  ],
  subtotal: 189.97,
  shipping: 0,
  tax: 15.2,
  total: 205.17,
  customer: {
    firstName: "Ryan",
    lastName: "Sheuser",
    email: TO,
    address1: "123 Research Ave",
    city: "Denver",
    state: "CO",
    zip: "80202",
    country: "US",
  },
  siteName: "Elevate Precision Health",
});

const outDir = resolve("tmp");
mkdirSync(outDir, { recursive: true });

const htmlPath = resolve(outDir, "sample-order-confirmation.html");
const textPath = resolve(outDir, "sample-order-confirmation.txt");

// Offline-friendly logo for local browser preview
const previewHtml = message.html.replaceAll(
  getEmailLogoUrl(),
  "../public/images/logo.png",
);

writeFileSync(htmlPath, previewHtml, "utf8");
writeFileSync(textPath, message.text, "utf8");

async function main(): Promise<void> {
  console.log(`Subject: ${message.subject}`);
  console.log(`To: ${message.to}`);
  console.log(`Preview HTML: ${htmlPath}`);
  console.log(`Preview text: ${textPath}`);

  if (shouldSend) {
    const provider = getEmailProvider();
    await provider.send(message);
    console.log(`Sent via ${provider.name} to ${message.to}`);
    return;
  }

  console.log("Skipped send (pass --send with Resend env configured).");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
