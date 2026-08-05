import { site } from "@/data/site";
import { escapeEmailHtml, getEmailPublicSiteUrl } from "@/lib/email/emailLayout";
import {
  marketingEmailFooterText,
  RESEND_UNSUBSCRIBE_URL_PLACEHOLDER,
  wrapMarketingEmailHtml,
} from "@/lib/email/marketingEmailLayout";

export const WELCOME_EMAIL_SUBJECT = "Welcome to Elevate Precision Health";
export const WELCOME_EMAIL_HEADING = "Welcome to Elevate Precision Health";
export const WELCOME_PRODUCTS_CTA_URL = `${getEmailPublicSiteUrl()}/products`;

/** Subscriber welcome offer — change here to update HTML, text, and Resend sync. */
export const WELCOME_PROMO_CODE = "WELCOME20";
export const WELCOME_PROMO_DISCOUNT_LABEL = "20% off";
export const WELCOME_PROMO_SCOPE = "your first order";

/**
 * Resend reserved contact variable — use in HTML/text, do NOT declare in
 * the template `variables` array (FIRST_NAME / EMAIL / RESEND_UNSUBSCRIBE_URL
 * are reserved).
 */
export const RESEND_FIRST_NAME_PLACEHOLDER = "{{{FIRST_NAME}}}";
export const FIRST_NAME_FALLBACK = "there";

export type WelcomeEmailContent = {
  subject: string;
  html: string;
  text: string;
};

export type BuildWelcomeEmailOptions = {
  /** When set, renders a concrete name (local preview). */
  firstName?: string;
  /**
   * When true, embeds Resend placeholders for first name + unsubscribe
   * (used when syncing the hosted template).
   */
  forResendTemplate?: boolean;
  /** Override unsubscribe href (preview only). */
  unsubscribeUrl?: string;
};

function resolveFirstNameToken(options: BuildWelcomeEmailOptions): {
  htmlToken: string;
  textToken: string;
} {
  if (options.forResendTemplate) {
    return {
      htmlToken: RESEND_FIRST_NAME_PLACEHOLDER,
      textToken: RESEND_FIRST_NAME_PLACEHOLDER,
    };
  }

  const trimmed = options.firstName?.trim();
  if (trimmed) {
    return {
      htmlToken: escapeEmailHtml(trimmed),
      textToken: trimmed,
    };
  }

  return {
    htmlToken: escapeEmailHtml(FIRST_NAME_FALLBACK),
    textToken: FIRST_NAME_FALLBACK,
  };
}

function welcomeBodyHtml(firstNameHtml: string, productsUrl: string): string {
  const ctaHref = escapeEmailHtml(productsUrl);
  const promoCode = escapeEmailHtml(WELCOME_PROMO_CODE);
  return `
    <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0a1628;">
      Hi ${firstNameHtml},
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:#f0f4f8;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#5a6a7e;">
            Subscriber offer
          </p>
          <p style="margin:0 0 10px;font-size:15px;line-height:1.55;color:#0a1628;">
            Use code <strong style="color:#00a0ec;letter-spacing:0.04em;">${promoCode}</strong> for ${escapeEmailHtml(WELCOME_PROMO_DISCOUNT_LABEL)} ${escapeEmailHtml(WELCOME_PROMO_SCOPE)}.
          </p>
          <p style="margin:0;font-size:13px;line-height:1.5;color:#5a6a7e;">
            Enter the code at checkout on your first purchase. One-time use per customer; cannot be combined with other offers.
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#5a6a7e;">
      What to expect
    </p>
    <ul style="margin:0 0 16px;padding:0 0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0a1628;">
      <li style="margin:0 0 6px;">New product and inventory announcements</li>
      <li style="margin:0 0 6px;">Certificate and testing-document updates</li>
      <li style="margin:0 0 6px;">Research-focused company news</li>
      <li style="margin:0 0 6px;">Occasional subscriber offers</li>
    </ul>
    <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0a1628;">
      We aim to keep our emails useful and infrequent. You can update your preferences or unsubscribe at any time using the link below.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td style="border-radius:4px;background-color:#00a0ec;">
          <a href="${ctaHref}" style="display:inline-block;padding:12px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
            Explore our products
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0a1628;">
      Thank you for being part of the Elevate Precision Health research community.
    </p>`;
}

function welcomeBodyText(firstNameText: string, productsUrl: string): string {
  return [
    `Hi ${firstNameText},`,
    "",
    "Subscriber offer",
    `Use code ${WELCOME_PROMO_CODE} for ${WELCOME_PROMO_DISCOUNT_LABEL} ${WELCOME_PROMO_SCOPE}.`,
    "Enter the code at checkout on your first purchase. One-time use per customer; cannot be combined with other offers.",
    "",
    "What to expect",
    "- New product and inventory announcements",
    "- Certificate and testing-document updates",
    "- Research-focused company news",
    "- Occasional subscriber offers",
    "",
    "We aim to keep our emails useful and infrequent. You can update your preferences or unsubscribe at any time using the link below.",
    "",
    `Explore our products: ${productsUrl}`,
    "",
    "Thank you for being part of the Elevate Precision Health research community.",
  ].join("\n");
}

const INTRO =
  "Thank you for subscribing. You’ll receive occasional company news, product availability updates, research-focused information, and special announcements from Elevate Precision Health.";

const PREVIEW_TEXT = `Thanks for subscribing — enjoy ${WELCOME_PROMO_DISCOUNT_LABEL} ${WELCOME_PROMO_SCOPE} with code ${WELCOME_PROMO_CODE}.`;

/**
 * Builds the newsletter welcome message (subject / html / text).
 * Transactional order emails are intentionally separate.
 */
export function buildWelcomeEmail(
  options: BuildWelcomeEmailOptions = {},
): WelcomeEmailContent {
  const { htmlToken, textToken } = resolveFirstNameToken(options);
  const productsUrl = WELCOME_PRODUCTS_CTA_URL;
  const unsubscribeUrl = options.forResendTemplate
    ? RESEND_UNSUBSCRIBE_URL_PLACEHOLDER
    : (options.unsubscribeUrl ?? RESEND_UNSUBSCRIBE_URL_PLACEHOLDER);

  const html = wrapMarketingEmailHtml({
    siteName: site.name,
    heading: WELCOME_EMAIL_HEADING,
    intro: INTRO,
    previewText: PREVIEW_TEXT,
    bodyHtml: welcomeBodyHtml(htmlToken, productsUrl),
    unsubscribeUrl,
  });

  const text = [
    site.name,
    "",
    WELCOME_EMAIL_HEADING,
    "",
    INTRO,
    "",
    welcomeBodyText(textToken, productsUrl),
    "",
    marketingEmailFooterText({ unsubscribeUrl }),
  ].join("\n");

  return {
    subject: WELCOME_EMAIL_SUBJECT,
    html,
    text,
  };
}

/**
 * Custom variables for the Resend template API.
 * Reserved keys (FIRST_NAME, EMAIL, RESEND_UNSUBSCRIBE_URL, etc.) are omitted —
 * they are provided by Resend automatically when present in the HTML.
 */
export function welcomeEmailTemplateVariables(): Array<{
  key: string;
  type: "string";
  fallbackValue: string;
}> {
  return [];
}
