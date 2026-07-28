import type { NextConfig } from "next";

// Permanent redirects for product slugs that were renamed. Kept here so any
// old bookmarks, shared links, or previously crawled URLs resolve to the
// current canonical URL instead of a 404.
const RENAMED_PRODUCT_SLUGS: ReadonlyArray<{ from: string; to: string }> = [
  { from: "bp-3r", to: "glp-3" },
  { from: "bp-2t", to: "glp-2" },
];

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  async redirects() {
    return RENAMED_PRODUCT_SLUGS.map(({ from, to }) => ({
      source: `/products/${from}`,
      destination: `/products/${to}`,
      permanent: true,
    }));
  },
  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "connect-src 'self' https:",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join("; "),
      },
    ];
    if (isProd) {
      security.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }
    return [
      {
        source: "/:path*",
        headers: security,
      },
    ];
  },
};

export default nextConfig;
