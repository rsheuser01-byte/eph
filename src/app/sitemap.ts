import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { resourcePages } from "@/data/resources";
import { getSiteUrl } from "@/lib/seo/siteUrl";

// Public, canonical, indexable routes only. Transactional/private routes
// (cart, checkout, checkout/success, admin, api) are excluded by design and
// carry a page-level `noindex` directive instead.
const STATIC_PATHS = [
  "/",
  "/products",
  "/about",
  "/coa",
  "/contact",
  "/resources",
  "/privacy",
  "/terms",
  "/refunds",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: path === "/" ? `${baseUrl}/` : `${baseUrl}${path}`,
  }));

  const resourceEntries: MetadataRoute.Sitemap = resourcePages.map((page) => ({
    url: `${baseUrl}/resources/${page.slug}`,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
  }));

  // `lastModified` is intentionally omitted: the catalog data contains no
  // trustworthy modification timestamps, so inventing one would be misleading.
  return [...staticEntries, ...resourceEntries, ...productEntries];
}
