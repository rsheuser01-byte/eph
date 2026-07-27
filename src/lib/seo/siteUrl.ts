/**
 * Canonical base URL for the site.
 *
 * Primary source is `NEXT_PUBLIC_SITE_URL`, which must be set in the
 * deployment environment (see `.env.example`). The remaining values are
 * build/preview fallbacks only and must not be treated as the production
 * canonical host.
 */
const DEV_FALLBACK_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return stripTrailingSlashes(explicit);
  }

  // Vercel provides these automatically; useful for preview deployments
  // until NEXT_PUBLIC_SITE_URL is configured.
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) {
    return `https://${stripTrailingSlashes(vercelProduction)}`;
  }

  const vercelPreview = process.env.VERCEL_URL?.trim();
  if (vercelPreview) {
    return `https://${stripTrailingSlashes(vercelPreview)}`;
  }

  return DEV_FALLBACK_URL;
}

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}
