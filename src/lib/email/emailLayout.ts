import { site } from "@/data/site";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/seo/siteUrl";

/** Public asset used in transactional email headers. */
export const EMAIL_LOGO_PATH = "/images/logo.png";

const BRAND = {
  accent: "#00a0ec",
  navy: "#0a1628",
  muted: "#5a6a7e",
  line: "#e2e8f0",
  pageBg: "#f0f4f8",
  cardBg: "#ffffff",
} as const;

/** Always the live storefront — never localhost or preview hosts. */
export function getEmailPublicSiteUrl(): string {
  return CANONICAL_PRODUCTION_ORIGIN;
}

export function getEmailLogoUrl(): string {
  return `${getEmailPublicSiteUrl()}${EMAIL_LOGO_PATH}`;
}

/** Customer-facing support address (also used as Reply-To when sending). */
export function getSupportEmail(): string {
  const fromEnv = process.env.EMAIL_REPLY_TO?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : site.email;
}

/** Plain-text support + website lines for transactional footers. */
export function emailSupportFooterText(): string {
  const support = getSupportEmail();
  const url = getEmailPublicSiteUrl();
  return [
    `Questions about your order? Email us at ${support}`,
    `or visit ${url}`,
    "",
    "Research use only. Not for human or veterinary use.",
  ].join("\n");
}

export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type TransactionalEmailLayout = {
  siteName: string;
  heading: string;
  intro: string;
  bodyHtml: string;
};

/**
 * Shared branded shell for order emails: logo, accent bar, card layout.
 * Uses table-based markup for broad client compatibility.
 */
export function wrapTransactionalEmailHtml(
  layout: TransactionalEmailLayout,
): string {
  const siteName = escapeEmailHtml(layout.siteName);
  const heading = escapeEmailHtml(layout.heading);
  const intro = escapeEmailHtml(layout.intro);
  const logoUrl = escapeEmailHtml(getEmailLogoUrl());
  const siteUrl = escapeEmailHtml(getEmailPublicSiteUrl());
  const supportEmail = escapeEmailHtml(getSupportEmail());
  const siteUrlLabel = escapeEmailHtml(
    getEmailPublicSiteUrl().replace(/^https?:\/\//, ""),
  );

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.pageBg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.pageBg};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background-color:${BRAND.cardBg};border:1px solid ${BRAND.line};">
        <tr>
          <td style="height:4px;background-color:${BRAND.accent};font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;text-align:left;">
            <a href="${siteUrl}" style="text-decoration:none;">
              <img src="${logoUrl}" alt="${siteName}" width="220" style="display:block;width:220px;max-width:100%;height:auto;border:0;" />
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 8px;">
            <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:20px;line-height:1.35;color:${BRAND.navy};font-weight:700;">${heading}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${BRAND.muted};">
            ${intro}
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:${BRAND.navy};">
            ${layout.bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid ${BRAND.line};font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};">
            <p style="margin:0 0 8px;color:${BRAND.navy};font-weight:600;">${siteName}</p>
            <p style="margin:0 0 8px;">
              Questions about your order?
              Email us at
              <a href="mailto:${supportEmail}" style="color:${BRAND.accent};text-decoration:none;">${supportEmail}</a>
              or visit
              <a href="${siteUrl}" style="color:${BRAND.accent};text-decoration:none;">${siteUrlLabel}</a>.
            </p>
            <p style="margin:0;">Research use only. Not for human or veterinary use.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
