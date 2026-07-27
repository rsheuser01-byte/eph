import type { Metadata } from "next";

/**
 * Shared social share image. Resolved against `metadataBase` (root layout),
 * so a relative path is turned into an absolute URL by Next.js. Dimensions
 * match the physical file in `public/` (the 1.91:1 ratio platforms expect).
 */
export const ogImage = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
} as const;

type PageMetadataInput = {
  /** Page title routed through the root title template (`%s · Brand`). */
  title?: string;
  /** Use when the title should bypass the template (e.g. the homepage). */
  absoluteTitle?: string;
  description?: string;
  /** Canonical path, e.g. `/products`. Resolved against `metadataBase`. */
  path: string;
};

/**
 * Builds consistent metadata for a public, indexable page: canonical URL plus
 * Open Graph / Twitter fields derived from the same title and description.
 * Relative URLs are resolved against `metadataBase` (set in the root layout).
 */
export function pageMetadata({
  title,
  absoluteTitle,
  description,
  path,
}: PageMetadataInput): Metadata {
  const social = absoluteTitle ?? title;
  const imageAlt = social;

  // Next.js shallow-merges metadata, so a page-level `openGraph`/`twitter`
  // fully replaces the root layout's. The image and Twitter card are repeated
  // here so every page built through this helper keeps a valid social preview.
  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: social,
      description,
      url: path,
      images: [{ ...ogImage, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: social,
      description,
      images: [ogImage.url],
    },
  };
}
