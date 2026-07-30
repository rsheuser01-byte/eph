/**
 * Canonical base URL for the site.
 *
 * Primary source is `NEXT_PUBLIC_SITE_URL`, which must be set in the
 * deployment environment (see `.env.example`). The remaining values are
 * build/preview fallbacks only and must not be treated as the production
 * canonical host.
 *
 * Production canonical host is `www.elevateprecisionhealth.com` — the only
 * host that serves 200s. Bare `elevateprecisionhealth.com` 308-redirects to
 * www; if the env still points at the bare host, we rewrite so canonical
 * tags, sitemap, robots.txt, and JSON-LD all agree with that redirect.
 */
const DEV_FALLBACK_URL = "http://localhost:3000";

/** Final resolving production host (serves 200). */
export const CANONICAL_PRODUCTION_ORIGIN =
  "https://www.elevateprecisionhealth.com";

const BARE_PRODUCTION_HOST = "elevateprecisionhealth.com";
const CANONICAL_PRODUCTION_HOST = "www.elevateprecisionhealth.com";

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return canonicalizeSiteUrl(explicit);
  }

  // Vercel provides these automatically; useful for preview deployments
  // until NEXT_PUBLIC_SITE_URL is configured.
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) {
    return canonicalizeSiteUrl(`https://${stripTrailingSlashes(vercelProduction)}`);
  }

  const vercelPreview = process.env.VERCEL_URL?.trim();
  if (vercelPreview) {
    return canonicalizeSiteUrl(`https://${stripTrailingSlashes(vercelPreview)}`);
  }

  return DEV_FALLBACK_URL;
}

/**
 * Rewrites bare production host → www so SEO surfaces never emit a URL that
 * only 308-redirects. Non-production hosts are left unchanged.
 */
export function canonicalizeSiteUrl(value: string): string {
  const stripped = stripTrailingSlashes(value);
  try {
    const parsed = new URL(stripped);
    if (parsed.hostname === BARE_PRODUCTION_HOST) {
      parsed.hostname = CANONICAL_PRODUCTION_HOST;
      return stripTrailingSlashes(parsed.toString());
    }
  } catch {
    // Invalid URL — return stripped input unchanged.
  }
  return stripped;
}

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}
