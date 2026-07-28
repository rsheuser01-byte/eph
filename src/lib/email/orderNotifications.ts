import { formatUSD } from "@/lib/checkout/pricing";
import type { EmailMessage } from "./types";
import type { OrderEmailData } from "./orderConfirmation";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
    <p style="margin:16px 0 0;">Carrier: <strong>${escapeHtml(carrier)}</strong></p>
    ${
      trackingNumber
        ? `<p style="margin:6px 0 0;">Tracking number: <strong>${escapeHtml(
            trackingNumber,
          )}</strong></p>`
        : ""
    }
    ${
      trackingUrl
        ? `<p style="margin:6px 0 0;"><a href="${escapeHtml(
            trackingUrl,
          )}">Track your shipment</a></p>`
        : ""
    }`;

  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <h1 style="font-size:20px;margin:0 0 4px;">${escapeHtml(heading)}</h1>
      <p style="color:#555;margin:0 0 16px;">${escapeHtml(intro)}</p>
      <p style="margin:0 0 16px;">Order reference: <strong>${escapeHtml(
        data.orderId,
      )}</strong></p>
      ${trackingHtml}
      <p style="color:#888;font-size:12px;margin-top:24px;">Research use only. Not for human or veterinary use.</p>
    </div></body></html>`;

  return {
    to: data.customer.email,
    subject: `${data.siteName} order shipped — ${data.orderId}`,
    html,
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

  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <h1 style="font-size:20px;margin:0 0 4px;">${escapeHtml(heading)}</h1>
      <p style="color:#555;margin:0 0 16px;">${escapeHtml(intro)}</p>
      <p style="margin:0 0 8px;">Order reference: <strong>${escapeHtml(
        data.orderId,
      )}</strong></p>
      <p style="margin:0 0 4px;">Refund amount: <strong>${formatUSD(
        refund.refundedAmount,
      )}</strong></p>
      <p style="margin:0 0 4px;">Total refunded to date: ${formatUSD(
        refund.totalRefunded,
      )}</p>
      <p style="margin:0;">Order total: ${formatUSD(data.total)}</p>
      <p style="color:#888;font-size:12px;margin-top:24px;">Research use only. Not for human or veterinary use.</p>
    </div></body></html>`;

  return {
    to: data.customer.email,
    subject: `${data.siteName} ${kind} — ${data.orderId}`,
    html,
    text,
  };
}

export function buildCancelledEmail(data: OrderEmailData): EmailMessage {
  const heading = `Order cancelled — ${data.orderId}`;
  const intro = `Your ${data.siteName} order has been cancelled. If you were charged, a refund will follow according to our refund policy.`;

  const text = [
    heading,
    intro,
    "",
    `Order reference: ${data.orderId}`,
    "",
    "Research use only. Not for human or veterinary use.",
  ].join("\n");

  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <h1 style="font-size:20px;margin:0 0 4px;">${escapeHtml(heading)}</h1>
      <p style="color:#555;margin:0 0 16px;">${escapeHtml(intro)}</p>
      <p style="margin:0;">Order reference: <strong>${escapeHtml(
        data.orderId,
      )}</strong></p>
      <p style="color:#888;font-size:12px;margin-top:24px;">Research use only. Not for human or veterinary use.</p>
    </div></body></html>`;

  return {
    to: data.customer.email,
    subject: `${data.siteName} order cancelled — ${data.orderId}`,
    html,
    text,
  };
}
