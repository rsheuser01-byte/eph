import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  // Only API routes are disallowed here. Cart, checkout, and admin pages are
  // intentionally left crawlable so that crawlers can reach them and read the
  // page-level `noindex` directive. robots.txt is not an access-control layer.
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
