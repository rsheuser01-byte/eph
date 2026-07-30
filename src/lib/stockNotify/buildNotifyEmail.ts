import { getProductBySlug } from "@/data/products";
import { site } from "@/data/site";
import {
  escapeEmailHtml,
  wrapTransactionalEmailHtml,
} from "@/lib/email/emailLayout";
import type { EmailMessage } from "@/lib/email/types";
import { storeNotificationEmail } from "@/lib/email/storeRecipient";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import type { StockNotifyRequest } from "./parseRequest";

/** Store-facing email when a visitor asks to be notified of a restock. */
export function buildStockNotifyStoreEmail(
  request: StockNotifyRequest,
): EmailMessage {
  const product = getProductBySlug(request.productSlug);
  const productName = product?.name ?? request.productSlug;
  const productUrl = `${getSiteUrl()}/products/${request.productSlug}`;
  const subject = `Restock notify: ${productName} ${request.size}`;

  const bodyHtml = [
    `<p style="margin:0 0 12px;"><strong>Email:</strong> ${escapeEmailHtml(request.email)}</p>`,
    `<p style="margin:0 0 12px;"><strong>Product:</strong> ${escapeEmailHtml(productName)}</p>`,
    `<p style="margin:0 0 12px;"><strong>Size:</strong> ${escapeEmailHtml(request.size)}</p>`,
    `<p style="margin:0 0 12px;"><strong>SKU:</strong> ${escapeEmailHtml(request.sku)}</p>`,
    `<p style="margin:0;"><a href="${escapeEmailHtml(productUrl)}">${escapeEmailHtml(productUrl)}</a></p>`,
  ].join("");

  const html = wrapTransactionalEmailHtml({
    siteName: site.name,
    heading: "Restock notification request",
    intro: "A visitor asked to be emailed when this SKU is back in stock.",
    bodyHtml,
  });

  const text = [
    "Restock notification request",
    "",
    `Email: ${request.email}`,
    `Product: ${productName}`,
    `Size: ${request.size}`,
    `SKU: ${request.sku}`,
    `URL: ${productUrl}`,
  ].join("\n");

  return {
    to: storeNotificationEmail(),
    subject,
    html,
    text,
  };
}
