import { site } from "@/data/site";
import {
  escapeEmailHtml,
  getEmailLogoUrl,
  getEmailPublicSiteUrl,
  getSupportEmail,
} from "@/lib/email/emailLayout";

/** Keep in sync with transactional shell colors in emailLayout.ts */
const BRAND = {
  accent: "#00a0ec",
  navy: "#0a1628",
  muted: "#5a6a7e",
  line: "#e2e8f0",
  pageBg: "#f0f4f8",
  cardBg: "#ffffff",
} as const;

/** Exact Resend unsubscribe placeholder — never escape or alter. */
export const RESEND_UNSUBSCRIBE_URL_PLACEHOLDER = "{{{RESEND_UNSUBSCRIBE_URL}}}";

export type MarketingEmailLayout = {
  siteName: string;
  heading: string;
  intro: string;
  bodyHtml: string;
  /** Inbox preview / preheader text (shown beside the subject in many clients). */
  previewText?: string;
  /**
   * Href for the footer Unsubscribe link.
   * Defaults to the Resend placeholder for live templates.
   * Preview scripts may pass a safe example URL.
   */
  unsubscribeUrl?: string;
};

function unsubscribeHref(url: string): string {
  // Resend injects this token at send time — must remain literally unescaped.
  if (url === RESEND_UNSUBSCRIBE_URL_PLACEHOLDER) {
    return url;
  }
  return escapeEmailHtml(url);
}

/** Plain-text marketing footer (no transactional “Questions about your order?”). */
export function marketingEmailFooterText(options?: {
  unsubscribeUrl?: string;
}): string {
  const support = getSupportEmail();
  const url = getEmailPublicSiteUrl();
  const unsubscribe =
    options?.unsubscribeUrl ?? RESEND_UNSUBSCRIBE_URL_PLACEHOLDER;

  return [
    site.name,
    `Support: ${support}`,
    `Website: ${url}`,
    "",
    "Research use only. Not for human or veterinary use.",
    "",
    "You received this message because you subscribed to Elevate Precision Health news and product updates.",
    `Unsubscribe: ${unsubscribe}`,
  ].join("\n");
}

/**
 * Branded shell for marketing emails — matches transactional visuals,
 * with a subscription-aware footer (not order-support copy).
 */
export function wrapMarketingEmailHtml(layout: MarketingEmailLayout): string {
  const siteName = escapeEmailHtml(layout.siteName);
  const heading = escapeEmailHtml(layout.heading);
  const intro = escapeEmailHtml(layout.intro);
  const previewText = escapeEmailHtml(
    (layout.previewText ?? layout.intro).trim(),
  );
  const logoUrl = escapeEmailHtml(getEmailLogoUrl());
  const siteUrl = escapeEmailHtml(getEmailPublicSiteUrl());
  const supportEmail = escapeEmailHtml(getSupportEmail());
  const siteUrlLabel = escapeEmailHtml(
    getEmailPublicSiteUrl().replace(/^https?:\/\//, ""),
  );
  const unsubscribeUrl =
    layout.unsubscribeUrl ?? RESEND_UNSUBSCRIBE_URL_PLACEHOLDER;
  const unsubscribeLink = unsubscribeHref(unsubscribeUrl);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.pageBg};">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
${previewText}
</div>
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
              <a href="mailto:${supportEmail}" style="color:${BRAND.accent};text-decoration:none;">${supportEmail}</a>
              ·
              <a href="${siteUrl}" style="color:${BRAND.accent};text-decoration:none;">${siteUrlLabel}</a>
            </p>
            <p style="margin:0 0 8px;">Research use only. Not for human or veterinary use.</p>
            <p style="margin:0 0 8px;">You received this message because you subscribed to Elevate Precision Health news and product updates.</p>
            <p style="margin:0;">
              <a href="${unsubscribeLink}">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
