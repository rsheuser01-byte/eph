import { site } from "@/data/site";

type JsonLdObject = Record<string, unknown>;

/**
 * Organization schema. Only fields verifiable from the codebase are included;
 * address, telephone, logo, founder, and social profiles are intentionally
 * omitted because no verified source for them exists yet.
 */
export function organizationSchema(baseUrl: string): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: baseUrl,
    email: site.email,
    description: site.description,
  };
}

export function websiteSchema(baseUrl: string): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: baseUrl,
  };
}

export function breadcrumbSchema(
  baseUrl: string,
  crumbs: ReadonlyArray<{ name: string; path: string }>,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.path === "/" ? `${baseUrl}/` : `${baseUrl}${crumb.path}`,
    })),
  };
}
