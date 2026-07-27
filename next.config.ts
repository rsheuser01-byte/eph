import type { NextConfig } from "next";

// Permanent redirects for product slugs that were renamed. Kept here so any
// old bookmarks, shared links, or previously crawled URLs resolve to the
// current canonical URL instead of a 404.
const RENAMED_PRODUCT_SLUGS: ReadonlyArray<{ from: string; to: string }> = [
  { from: "bp-3r", to: "glp-3" },
  { from: "bp-2t", to: "glp-2" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return RENAMED_PRODUCT_SLUGS.map(({ from, to }) => ({
      source: `/products/${from}`,
      destination: `/products/${to}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
