import type { Metadata } from "next";

/**
 * Shared social share image — same asset as the homepage hero.
 * Resolved against `metadataBase` (root layout), so a relative path is
 * turned into an absolute URL by Next.js. Dimensions match the file.
 */
export const ogImage = {
  url: "/images/hero-banner.png",
  width: 1024,
  height: 438,
} as const;

export type SocialImage = {
  url: string;
  width: number;
  height: number;
  alt?: string;
};

type PageMetadataInput = {
  /** Page title routed through the root title template (`%s · Brand`). */
  title?: string;
  /** Use when the title should bypass the template (e.g. the homepage). */
  absoluteTitle?: string;
  description?: string;
  /** Canonical path, e.g. `/products`. Resolved against `metadataBase`. */
  path: string;
  /** Override the default hero OG/Twitter image (e.g. product packshot). */
  image?: SocialImage;
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
  image,
}: PageMetadataInput): Metadata {
  const social = absoluteTitle ?? title;
  const shareImage = image ?? { ...ogImage, alt: social };

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
      images: [
        {
          url: shareImage.url,
          width: shareImage.width,
          height: shareImage.height,
          alt: shareImage.alt ?? social,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: social,
      description,
      images: [shareImage.url],
    },
  };
}
