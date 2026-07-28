import { formatUSD } from "@/lib/checkout/pricing";
import type { BillingInfo, OrderItem } from "@/lib/payments/types";
import type { EmailMessage } from "./types";

export type OrderEmailData = {
  orderId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax?: number;
  total: number;
  customer: BillingInfo;
  siteName: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shippingLabel(shipping: number): string {
  return shipping === 0 ? "Free" : formatUSD(shipping);
}

function itemsText(items: OrderItem[]): string {
  return items
    .map(
      (item) =>
        `- ${item.name} (${item.size}) x${item.qty} — ${formatUSD(
          item.unitPrice * item.qty,
        )}`,
    )
    .join("\n");
}

function itemsHtml(items: OrderItem[]): string {
  return items
    .map(
      (item) =>
        `<tr><td style="padding:6px 0;">${escapeHtml(item.name)} (${escapeHtml(
          item.size,
        )}) &times;${item.qty}</td><td style="padding:6px 0;text-align:right;">${formatUSD(
          item.unitPrice * item.qty,
        )}</td></tr>`,
    )
    .join("");
}

function addressText(customer: BillingInfo): string {
  const lines = [
    `${customer.firstName} ${customer.lastName}`,
    customer.address1,
    customer.address2,
    `${customer.city}, ${customer.state} ${customer.zip}`,
    customer.country,
  ].filter((line) => line && line.trim().length > 0);
  return lines.join("\n");
}

function totalsHtml(data: OrderEmailData): string {
  const tax = data.tax ?? 0;
  return `
    <table style="width:100%;border-top:1px solid #ddd;margin-top:12px;">
      <tr><td style="padding:4px 0;">Subtotal</td><td style="padding:4px 0;text-align:right;">${formatUSD(
        data.subtotal,
      )}</td></tr>
      <tr><td style="padding:4px 0;">Shipping</td><td style="padding:4px 0;text-align:right;">${shippingLabel(
        data.shipping,
      )}</td></tr>
      <tr><td style="padding:4px 0;">Tax</td><td style="padding:4px 0;text-align:right;">${formatUSD(
        tax,
      )}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;">Total</td><td style="padding:8px 0;text-align:right;font-weight:bold;">${formatUSD(
        data.total,
      )}</td></tr>
    </table>`;
}

function baseHtml(heading: string, intro: string, data: OrderEmailData): string {
  return `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.5;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <h1 style="font-size:20px;margin:0 0 4px;">${escapeHtml(heading)}</h1>
      <p style="color:#555;margin:0 0 16px;">${escapeHtml(intro)}</p>
      <p style="margin:0 0 16px;">Order reference: <strong>${escapeHtml(
        data.orderId,
      )}</strong></p>
      <table style="width:100%;border-collapse:collapse;">${itemsHtml(
        data.items,
      )}</table>
      ${totalsHtml(data)}
      <h2 style="font-size:15px;margin:24px 0 6px;">Ship to</h2>
      <p style="white-space:pre-line;margin:0;color:#333;">${escapeHtml(
        addressText(data.customer),
      )}</p>
      <p style="color:#888;font-size:12px;margin-top:24px;">Research use only. Not for human or veterinary use.</p>
    </div></body></html>`;
}

function baseText(heading: string, intro: string, data: OrderEmailData): string {
  return [
    heading,
    intro,
    "",
    `Order reference: ${data.orderId}`,
    "",
    itemsText(data.items),
    "",
    `Subtotal: ${formatUSD(data.subtotal)}`,
    `Shipping: ${shippingLabel(data.shipping)}`,
    `Tax: ${formatUSD(data.tax ?? 0)}`,
    `Total: ${formatUSD(data.total)}`,
    "",
    "Ship to:",
    addressText(data.customer),
    "",
    "Research use only. Not for human or veterinary use.",
  ].join("\n");
}

export function buildCustomerConfirmation(data: OrderEmailData): EmailMessage {
  const heading = `Order confirmed — ${data.orderId}`;
  const intro = `Thank you for your order with ${data.siteName}. Payment was approved and your order is being prepared.`;
  return {
    to: data.customer.email,
    subject: `${data.siteName} order confirmation — ${data.orderId}`,
    html: baseHtml(heading, intro, data),
    text: baseText(heading, intro, data),
  };
}

export function buildStoreNotification(
  data: OrderEmailData,
  to: string,
): EmailMessage {
  const heading = `New order — ${data.orderId}`;
  const intro = `New order from ${data.customer.firstName} ${data.customer.lastName} (${data.customer.email}).`;
  return {
    to,
    subject: `New order ${data.orderId} — ${formatUSD(data.total)}`,
    html: baseHtml(heading, intro, data),
    text: baseText(heading, intro, data),
  };
}
