import { formatUSD } from "@/lib/checkout/pricing";
import type { EmailMessage } from "./types";
import type { OrderEmailData } from "./orderConfirmation";
import {
  escapeEmailHtml,
  wrapTransactionalEmailHtml,
} from "./emailLayout";

/** Allow only http(s) tracking links in customer email. */
export function safeTrackingUrl(url: string | undefined): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export type ShippingEmailDetails = {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
};

export type RefundEmailDetails = {
  /** Amount refunded in this action. */
  refundedAmount: number;
  /** Cumulative refunded total on the order. */
  totalRefunded: number;
  partial: boolean;
};

function simpleBody(orderId: string, extraHtml: string): string {
  return `
    <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0a1628;">
      Order reference: <strong style="color:#00a0ec;">${escapeEmailHtml(
        orderId,
      )}</strong>
    </p>
    ${extraHtml}`;
}

export function buildShippedEmail(
  data: OrderEmailData,
  shipping: ShippingEmailDetails,
): EmailMessage {
  const carrier = shipping.carrier?.trim() || "your carrier";
  const trackingNumber = shipping.trackingNumber?.trim() || "";
  const trackingUrl = safeTrackingUrl(shipping.trackingUrl) ?? "";

  const trackingLines = [
    `Carrier: ${carrier}`,
    trackingNumber ? `Tracking number: ${trackingNumber}` : null,
    trackingUrl ? `Track shipment: ${trackingUrl}` : null,
  ].filter(Boolean) as string[];

  const heading = `Your order has shipped — ${data.orderId}`;
  const intro = `Good news — ${data.siteName} has shipped your order.`;

  const text = [
    data.siteName,
    "",
    heading,
    intro,
    "",
    `Order reference: ${data.orderId}`,
    "",
    ...trackingLines,
    "",
    "Research use only. Not for human or veterinary use.",
  ].join("\n");

  const trackingHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;border:1px solid #e2e8f0;">
      <tr>
        <td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#0a1628;">
          <p style="margin:0 0 8px;">Carrier: <strong>${escapeEmailHtml(
            carrier,
          )}</strong></p>
          ${
            trackingNumber
              ? `<p style="margin:0 0 8px;">Tracking number: <strong>${escapeEmailHtml(
                  trackingNumber,
                )}</strong></p>`
              : ""
          }
          ${
            trackingUrl
              ? `<p style="margin:0;"><a href="${escapeEmailHtml(
                  trackingUrl,
                )}" style="color:#00a0ec;font-weight:600;">Track your shipment</a></p>`
              : ""
          }
        </td>
      </tr>
    </table>`;

  return {
    to: data.customer.email,
    subject: `${data.siteName} order shipped — ${data.orderId}`,
    html: wrapTransactionalEmailHtml({
      siteName: data.siteName,
      heading,
      intro,
      bodyHtml: simpleBody(data.orderId, trackingHtml),
    }),
    text,
  };
}

export function buildRefundEmail(
  data: OrderEmailData,
  refund: RefundEmailDetails,
): EmailMessage {
  const kind = refund.partial ? "partial refund" : "full refund";
  const heading = `Refund processed — ${data.orderId}`;
  const intro = `We processed a ${kind} of ${formatUSD(
    refund.refundedAmount,
  )} for your ${data.siteName} order.`;

  const text = [
    data.siteName,
    "",
    heading,
    intro,
    "",
    `Order reference: ${data.orderId}`,
    `Refund amount: ${formatUSD(refund.refundedAmount)}`,
    `Total refunded to date: ${formatUSD(refund.totalRefunded)}`,
    `Order total: ${formatUSD(data.total)}`,
    "",
    "Research use only. Not for human or veterinary use.",
  ].join("\n");

  const detailsHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e2e8f0;">
      <tr>
        <td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5a6a7e;">Refund amount</td>
        <td style="padding:8px 0;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0a1628;font-weight:700;">${formatUSD(
          refund.refundedAmount,
        )}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5a6a7e;">Total refunded to date</td>
        <td style="padding:8px 0;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0a1628;">${formatUSD(
          refund.totalRefunded,
        )}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#5a6a7e;">Order total</td>
        <td style="padding:8px 0;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0a1628;">${formatUSD(
          data.total,
        )}</td>
      </tr>
    </table>`;

  return {
    to: data.customer.email,
    subject: `${data.siteName} ${kind} — ${data.orderId}`,
    html: wrapTransactionalEmailHtml({
      siteName: data.siteName,
      heading,
      intro,
      bodyHtml: simpleBody(data.orderId, detailsHtml),
    }),
    text,
  };
}

export function buildCancelledEmail(data: OrderEmailData): EmailMessage {
  const heading = `Order cancelled — ${data.orderId}`;
  const intro = `Your ${data.siteName} order has been cancelled. If you were charged, a refund will follow according to our refund policy.`;

  const text = [
    data.siteName,
    "",
    heading,
    intro,
    "",
    `Order reference: ${data.orderId}`,
    "",
    "Research use only. Not for human or veterinary use.",
  ].join("\n");

  return {
    to: data.customer.email,
    subject: `${data.siteName} order cancelled — ${data.orderId}`,
    html: wrapTransactionalEmailHtml({
      siteName: data.siteName,
      heading,
      intro,
      bodyHtml: simpleBody(data.orderId, ""),
    }),
    text,
  };
}
