import { site } from "@/data/site";
import { formatUSD } from "@/lib/checkout/pricing";
import { escapeEmailHtml } from "@/lib/email/emailLayout";
import {
  marketingEmailFooterText,
  RESEND_UNSUBSCRIBE_URL_PLACEHOLDER,
  wrapMarketingEmailHtml,
} from "@/lib/email/marketingEmailLayout";
import type { AbandonedCartEmailPayload } from "@/lib/abandonedCart/types";
import type { EmailMessage } from "@/lib/email/types";

export const ABANDONED_CART_EMAIL_SUBJECT = "Still thinking it over?";
export const ABANDONED_CART_EMAIL_HEADING = "Still thinking it over?";
export const ABANDONED_CART_FOOTER_REASON =
  "You received this message because you started checkout on our site and left items in your cart.";

export type AbandonedCartEmailContent = {
  subject: string;
  html: string;
  text: string;
};

function itemRowsHtml(
  items: AbandonedCartEmailPayload["items"],
): string {
  return items
    .map((item) => {
      const name = escapeEmailHtml(item.name);
      const option = escapeEmailHtml(item.option);
      const imageUrl = escapeEmailHtml(item.imageUrl);
      const qty = escapeEmailHtml(String(item.quantity));
      const price = escapeEmailHtml(formatUSD(item.unitPrice));
      const image = item.imageUrl
        ? `<img src="${imageUrl}" alt="${name}" width="72" style="display:block;width:72px;height:auto;border:0;" />`
        : "";
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;width:88px;">
            ${image}
          </td>
          <td style="padding:12px 0 12px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
            <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#0a1628;">${name}</p>
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5a6a7e;">${option} · Qty ${qty} · ${price}</p>
          </td>
        </tr>`;
    })
    .join("");
}

function itemRowsText(items: AbandonedCartEmailPayload["items"]): string {
  return items
    .map(
      (item) =>
        `- ${item.name} (${item.option}) × ${item.quantity} @ ${formatUSD(item.unitPrice)}`,
    )
    .join("\n");
}

export function buildAbandonedCartEmailHtml(
  data: AbandonedCartEmailPayload,
  options?: { unsubscribeUrl?: string },
): string {
  const restoreUrl = escapeEmailHtml(data.restoreUrl);
  const subtotal = escapeEmailHtml(formatUSD(data.subtotal));
  const firstName = data.firstName.trim();
  const greeting = firstName
    ? `Hi ${escapeEmailHtml(firstName)},`
    : "Hi,";
  const bodyHtml = `
    <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0a1628;">
      ${greeting}
    </p>
    <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0a1628;">
      You left items in your cart on ${escapeEmailHtml(site.name)}. They are still saved if you would like to finish your order.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
      ${itemRowsHtml(data.items)}
    </table>
    <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#0a1628;">
      Subtotal ${subtotal}
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
      <tr>
        <td style="background-color:#00a0ec;">
          <a href="${restoreUrl}" style="display:inline-block;padding:14px 22px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;color:#04070f;">
            Return to your cart
          </a>
        </td>
      </tr>
    </table>
  `;

  return wrapMarketingEmailHtml({
    siteName: site.name,
    heading: ABANDONED_CART_EMAIL_HEADING,
    intro: "Your cart is still saved when you are ready to continue.",
    bodyHtml,
    previewText: "Your cart is still saved when you are ready to continue.",
    unsubscribeUrl: options?.unsubscribeUrl,
    footerReason: ABANDONED_CART_FOOTER_REASON,
  });
}

export function buildAbandonedCartEmailText(
  data: AbandonedCartEmailPayload,
  options?: { unsubscribeUrl?: string },
): string {
  const firstName = data.firstName.trim() || "there";
  return [
    `Hi ${firstName},`,
    "",
    `You left items in your cart on ${site.name}. They are still saved if you would like to finish your order.`,
    "",
    itemRowsText(data.items),
    "",
    `Subtotal ${formatUSD(data.subtotal)}`,
    `Cart total ${formatUSD(data.subtotal)}`,
    "",
    `Return to your cart: ${data.restoreUrl}`,
    "",
    marketingEmailFooterText({
      unsubscribeUrl: options?.unsubscribeUrl,
      footerReason: ABANDONED_CART_FOOTER_REASON,
    }),
  ].join("\n");
}

export function buildAbandonedCartEmail(
  data: AbandonedCartEmailPayload,
  options?: { unsubscribeUrl?: string },
): EmailMessage {
  return {
    to: data.email,
    subject: ABANDONED_CART_EMAIL_SUBJECT,
    html: buildAbandonedCartEmailHtml(data, options),
    text: buildAbandonedCartEmailText(data, options),
  };
}

export { RESEND_UNSUBSCRIBE_URL_PLACEHOLDER };
