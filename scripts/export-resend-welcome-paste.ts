/**
 * Export a minimal Resend-dashboard-safe welcome HTML.
 * Avoids patterns that trigger Resend's "placeholder / command-line script"
 * quality warning: {{{vars}}}, "Hi there", hidden preheader/mso-hide CSS,
 * and "use code" phrasing.
 *
 * Usage: npm run export:resend-welcome-paste
 */
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import { site } from "../src/data/site";
import {
  WELCOME_EMAIL_HEADING,
  WELCOME_EMAIL_SUBJECT,
  WELCOME_PRODUCTS_CTA_URL,
  WELCOME_PROMO_CODE,
  WELCOME_PROMO_DISCOUNT_LABEL,
  WELCOME_PROMO_SCOPE,
} from "../src/lib/email/marketing/welcomeEmail";
import {
  getEmailLogoUrl,
  getEmailPublicSiteUrl,
  getSupportEmail,
} from "../src/lib/email/emailLayout";

const siteUrl = getEmailPublicSiteUrl();
const logoUrl = getEmailLogoUrl();
const support = getSupportEmail();
const siteLabel = siteUrl.replace(/^https?:\/\//, "");

/**
 * Deliberately simple table email — full document, no hidden preheader,
 * no mso-hide, no template braces, no "Hi there".
 */
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${WELCOME_EMAIL_HEADING}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background-color:#ffffff;border:1px solid #e2e8f0;">
        <tr>
          <td style="height:4px;background-color:#00a0ec;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;">
            <a href="${siteUrl}" style="text-decoration:none;">
              <img src="${logoUrl}" alt="${site.name}" width="220" style="display:block;width:220px;max-width:100%;height:auto;border:0;" />
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 8px;">
            <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.35;color:#0a1628;font-weight:700;">${WELCOME_EMAIL_HEADING}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#5a6a7e;">
            Thank you for joining our research community. You will receive occasional company news, product availability updates, and announcements from Elevate Precision Health.
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0a1628;">
            <p style="margin:0 0 16px;">Hello,</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:#f0f4f8;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#5a6a7e;">Subscriber offer</p>
                  <p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:#0a1628;">
                    Enjoy ${WELCOME_PROMO_DISCOUNT_LABEL} ${WELCOME_PROMO_SCOPE} with promo <strong style="color:#00a0ec;">${WELCOME_PROMO_CODE}</strong>.
                  </p>
                  <p style="margin:0;font-size:13px;line-height:1.5;color:#5a6a7e;">
                    Apply ${WELCOME_PROMO_CODE} when you place your first purchase. One-time use per customer; not combined with other offers.
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#5a6a7e;">What to expect</p>
            <ul style="margin:0 0 16px;padding-left:20px;">
              <li style="margin:0 0 6px;">New product and inventory announcements</li>
              <li style="margin:0 0 6px;">Certificate and testing-document updates</li>
              <li style="margin:0 0 6px;">Research-focused company news</li>
              <li style="margin:0 0 6px;">Occasional subscriber offers</li>
            </ul>
            <p style="margin:0 0 24px;">We aim to keep messages useful and infrequent. You can unsubscribe at any time using the link below.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
              <tr>
                <td style="border-radius:4px;background-color:#00a0ec;">
                  <a href="${WELCOME_PRODUCTS_CTA_URL}" style="display:inline-block;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">Explore our products</a>
                </td>
              </tr>
            </table>
            <p style="margin:0;">Thank you for being part of the Elevate Precision Health research community.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#5a6a7e;">
            <p style="margin:0 0 8px;color:#0a1628;font-weight:600;">${site.name}</p>
            <p style="margin:0 0 8px;">
              <a href="mailto:${support}" style="color:#00a0ec;text-decoration:none;">${support}</a>
              ·
              <a href="${siteUrl}" style="color:#00a0ec;text-decoration:none;">${siteLabel}</a>
            </p>
            <p style="margin:0 0 8px;">Research use only. Not for human or veterinary use.</p>
            <p style="margin:0 0 8px;">You received this message because you subscribed to Elevate Precision Health news and product updates.</p>
            <p style="margin:0;"><a href="${siteUrl}" style="color:#00a0ec;text-decoration:none;">Unsubscribe</a></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`;

const text = [
  site.name,
  "",
  WELCOME_EMAIL_HEADING,
  "",
  "Thank you for joining our research community. You will receive occasional company news, product availability updates, and announcements from Elevate Precision Health.",
  "",
  "Hello,",
  "",
  "Subscriber offer",
  `Enjoy ${WELCOME_PROMO_DISCOUNT_LABEL} ${WELCOME_PROMO_SCOPE} with promo ${WELCOME_PROMO_CODE}.`,
  `Apply ${WELCOME_PROMO_CODE} when you place your first purchase. One-time use per customer; not combined with other offers.`,
  "",
  "What to expect",
  "- New product and inventory announcements",
  "- Certificate and testing-document updates",
  "- Research-focused company news",
  "- Occasional subscriber offers",
  "",
  "We aim to keep messages useful and infrequent. You can unsubscribe at any time using the link below.",
  "",
  `Explore our products: ${WELCOME_PRODUCTS_CTA_URL}`,
  "",
  "Thank you for being part of the Elevate Precision Health research community.",
  "",
  site.name,
  `Support: ${support}`,
  `Website: ${siteUrl}`,
  "",
  "Research use only. Not for human or veterinary use.",
  "",
  "You received this message because you subscribed to Elevate Precision Health news and product updates.",
  `Unsubscribe: ${siteUrl}`,
].join("\n");

const banned = [
  "{{{",
  "}}}",
  "Hi there",
  "mso-hide",
  "display:none",
  "Use code",
  "lorem",
  "placeholder",
  "dummy",
];

const haystack = `${html}\n${text}`.toLowerCase();
const hits = banned.filter((token) => haystack.includes(token.toLowerCase()));
if (hits.length > 0) {
  console.error(`Paste export still contains flagged tokens: ${hits.join(", ")}`);
  process.exitCode = 1;
} else {
  const outDir = resolve("tmp");
  mkdirSync(outDir, { recursive: true });
  const htmlPath = resolve(outDir, "resend-welcome-template.html");
  const textPath = resolve(outDir, "resend-welcome-template.txt");
  writeFileSync(htmlPath, html, "utf8");
  writeFileSync(textPath, text, "utf8");
  console.log(`Subject: ${WELCOME_EMAIL_SUBJECT}`);
  console.log(`Preview text (set in Resend UI): Thanks for joining — ${WELCOME_PROMO_DISCOUNT_LABEL} ${WELCOME_PROMO_SCOPE} with promo ${WELCOME_PROMO_CODE}.`);
  console.log(`Paste-safe HTML: ${htmlPath}`);
  console.log(`Paste-safe text: ${textPath}`);
  console.log("After paste: Insert → Unsubscribe on the Unsubscribe link in Resend.");
}
