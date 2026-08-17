import { getSiteUrl } from "@/lib/seo/siteUrl";
import { IDENTIFIED_IDEMPOTENCY_PREFIX } from "./constants";

export function siteOrigin(): string {
  return getSiteUrl().replace(/\/$/, "");
}

export function restoreCartUrl(restoreToken: string): string {
  return `${siteOrigin()}/cart/restore/${encodeURIComponent(restoreToken)}`;
}

export function abandonedCartStatusUrl(publicId: string): string {
  return `${siteOrigin()}/api/abandoned-cart/${encodeURIComponent(publicId)}/status`;
}

export function abandonedCartDataUrl(publicId: string): string {
  return `${siteOrigin()}/api/abandoned-cart/${encodeURIComponent(publicId)}`;
}

export function identifiedIdempotencyKey(publicId: string): string {
  return `${IDENTIFIED_IDEMPOTENCY_PREFIX}${publicId}`;
}

export function convertedIdempotencyKey(publicId: string): string {
  return `${IDENTIFIED_IDEMPOTENCY_PREFIX}${publicId}:converted`;
}
