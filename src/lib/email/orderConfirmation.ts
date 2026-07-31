import { formatUSD } from "@/lib/checkout/pricing";
import type { BillingInfo, OrderItem } from "@/lib/payments/types";
import type { EmailMessage } from "./types";
import {
  emailSupportFooterText,
  escapeEmailHtml,
  wrapTransactionalEmailHtml,
} from "./emailLayout";

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
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0a1628;">${escapeEmailHtml(
            item.name,
          )} <span style="color:#5a6a7e;">(${escapeEmailHtml(
            item.size,
          )}) &times;${item.qty}</span></td>
          <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0a1628;white-space:nowrap;">${formatUSD(
            item.unitPrice * item.qty,
          )}</td>
        </tr>`,
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
  const row = (label: string, value: string, bold = false) =>
    `<tr>
      <td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${
        bold ? "#0a1628" : "#5a6a7e"
      };${bold ? "font-weight:700;" : ""}">${label}</td>
      <td style="padding:6px 0;text-align:right;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0a1628;${
        bold ? "font-weight:700;" : ""
      }">${value}</td>
    </tr>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;border-top:1px solid #e2e8f0;">
      ${row("Subtotal", formatUSD(data.subtotal))}
      ${row("Shipping", shippingLabel(data.shipping))}
      ${row("Tax", formatUSD(tax))}
      ${row("Total", formatUSD(data.total), true)}
    </table>`;
}

function orderBodyHtml(data: OrderEmailData): string {
  return `
    <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#0a1628;">
      Order reference: <strong style="color:#00a0ec;">${escapeEmailHtml(
        data.orderId,
      )}</strong>
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      ${itemsHtml(data.items)}
    </table>
    ${totalsHtml(data)}
    <p style="margin:24px 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#5a6a7e;">
      Ship to
    </p>
    <p style="white-space:pre-line;margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#0a1628;">${escapeEmailHtml(
      addressText(data.customer),
    )}</p>`;
}

function baseText(heading: string, intro: string, data: OrderEmailData): string {
  return [
    data.siteName,
    "",
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
    emailSupportFooterText(),
  ].join("\n");
}

function buildOrderEmail(
  data: OrderEmailData,
  to: string,
  subject: string,
  heading: string,
  intro: string,
): EmailMessage {
  return {
    to,
    subject,
    html: wrapTransactionalEmailHtml({
      siteName: data.siteName,
      heading,
      intro,
      bodyHtml: orderBodyHtml(data),
    }),
    text: baseText(heading, intro, data),
  };
}

export function buildCustomerConfirmation(data: OrderEmailData): EmailMessage {
  const heading = `Order confirmed — ${data.orderId}`;
  const intro = `Thank you for your order with ${data.siteName}. Payment was approved and your order is being prepared.`;
  return buildOrderEmail(
    data,
    data.customer.email,
    `${data.siteName} order confirmation — ${data.orderId}`,
    heading,
    intro,
  );
}

export function buildStoreNotification(
  data: OrderEmailData,
  to: string,
): EmailMessage {
  const heading = `New order — ${data.orderId}`;
  const intro = `New order from ${data.customer.firstName} ${data.customer.lastName} (${data.customer.email}).`;
  return buildOrderEmail(
    data,
    to,
    `New order ${data.orderId} — ${formatUSD(data.total)}`,
    heading,
    intro,
  );
}
