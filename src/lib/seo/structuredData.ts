import type { Product } from "@/data/products";
import { productDisplayName, productPriceRange, productPrimaryImage } from "@/data/products";
import { productContentUpdatedOn } from "@/data/contentDates";
import { site } from "@/data/site";
import {
  averageRating,
  canEmitReviewSchema,
  ratedTestimonials,
  testimonials,
  type Testimonial,
} from "@/data/testimonials";
import {
  hasPostalAddress,
  trustSignals,
} from "@/data/trustSignals";

type JsonLdObject = Record<string, unknown>;

const IN_STOCK = "https://schema.org/InStock";
const OUT_OF_STOCK = "https://schema.org/OutOfStock";
const NEW_CONDITION = "https://schema.org/NewCondition";

/**
 * Organization schema. Includes address / legalName / contactPoint only when
 * present in trustSignals — never invents phone, founder, or empty sameAs.
 */
export function organizationSchema(baseUrl: string): JsonLdObject {
  const schema: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: baseUrl,
    email: site.email,
    description: site.description,
    logo: `${baseUrl}/images/logo-header-transparent.png`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: site.email,
      url: `${baseUrl}/contact`,
      availableLanguage: "English",
    },
  };

  if (trustSignals.legalEntityName) {
    schema.legalName = trustSignals.legalEntityName;
  }

  if (hasPostalAddress(trustSignals)) {
    const address: JsonLdObject = {
      "@type": "PostalAddress",
      streetAddress: trustSignals.streetAddress,
      addressLocality: trustSignals.addressLocality,
      addressRegion: trustSignals.addressRegion,
      postalCode: trustSignals.postalCode,
      addressCountry: trustSignals.addressCountry ?? "US",
    };
    if (trustSignals.postOfficeBoxNumber?.trim()) {
      address.postOfficeBoxNumber = trustSignals.postOfficeBoxNumber.trim();
    }
    schema.address = address;
  }

  if (trustSignals.telephone) {
    schema.telephone = trustSignals.telephone;
    (schema.contactPoint as JsonLdObject).telephone = trustSignals.telephone;
  }

  if (trustSignals.sameAs.length > 0) {
    schema.sameAs = [...trustSignals.sameAs];
  }

  return schema;
}

export function websiteSchema(baseUrl: string): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: baseUrl,
  };
}

/**
 * Organization review / aggregateRating block (Phase 3 #4).
 * Returns null until enough vetted, rated testimonials exist — never invent ratings.
 */
export function organizationReviewSchema(
  baseUrl: string,
  entries: readonly Testimonial[] = testimonials,
): JsonLdObject | null {
  if (!canEmitReviewSchema(entries)) {
    return null;
  }

  const rated = ratedTestimonials(entries);
  const avg = averageRating(entries);
  if (avg === null) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: baseUrl,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: avg.toFixed(1).replace(/\.0$/, ""),
      reviewCount: String(rated.length),
      bestRating: "5",
      worstRating: "1",
    },
    review: rated.map((entry) => ({
      "@type": "Review",
      reviewBody: entry.quote,
      datePublished: entry.publishedOn,
      author: {
        "@type": "Organization",
        name: entry.attributionName
          ? `${entry.attributionName} (${entry.institutionType})`
          : entry.institutionType,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(entry.rating),
        bestRating: "5",
        worstRating: "1",
      },
    })),
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

/**
 * FAQPage JSON-LD for the contact FAQ section (Phase 3 #2).
 */
export function faqPageSchema(
  items: ReadonlyArray<{ question: string; answer: string }>,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

/**
 * ItemList for the `/products` catalog — one ListItem per live catalog SKU.
 */
export function catalogItemListSchema(
  baseUrl: string,
  catalog: ReadonlyArray<Pick<Product, "name" | "slug" | "commonName">>,
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${site.name} Product Catalog`,
    url: `${baseUrl}/products`,
    numberOfItems: catalog.length,
    itemListElement: catalog.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: productDisplayName(product),
      url: `${baseUrl}/products/${product.slug}`,
    })),
  };
}

/**
 * Product / Offer JSON-LD for a catalog detail page.
 *
 * Prices and SKUs come from the product catalog; availability comes from the
 * inventory map (`null` = inventory not configured → treat as in stock).
 * Single-variant products emit `Offer`; multi-size products emit
 * `AggregateOffer` with live low/high/offerCount.
 */
export function productSchema(
  baseUrl: string,
  product: Product,
  availability: Record<string, number | null> = {},
): JsonLdObject {
  const url = `${baseUrl}/products/${product.slug}`;
  const imagePath = productPrimaryImage(product);
  const brand = {
    "@type": "Brand",
    name: site.name,
  };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productDisplayName(product),
    sku: product.sku,
    description: product.shortDescription,
    category: product.category,
    url,
    image: imagePath ? `${baseUrl}${imagePath}` : undefined,
    brand,
    dateModified: productContentUpdatedOn(product),
    offers: buildOffers(baseUrl, url, product, availability),
  };
}

function buildOffers(
  baseUrl: string,
  productUrl: string,
  product: Product,
  availability: Record<string, number | null>,
): JsonLdObject {
  const seller = {
    "@type": "Organization",
    name: site.name,
    url: baseUrl,
  };

  if (product.variants.length <= 1) {
    const variant = product.variants[0];
    return {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "USD",
      price: variant ? formatSchemaPrice(variant.price) : undefined,
      availability: schemaAvailabilityForSku(variant?.sku, availability),
      itemCondition: NEW_CONDITION,
      seller,
    };
  }

  const { min, max } = productPriceRange(product);
  return {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: formatSchemaPrice(min),
    highPrice: formatSchemaPrice(max),
    offerCount: String(product.variants.length),
    availability: schemaAvailabilityForProduct(product, availability),
    url: productUrl,
  };
}

function formatSchemaPrice(amount: number): string {
  return amount.toFixed(2);
}

/** null/undefined qty = inventory off or unknown → InStock (matches UI). */
function isSkuInStock(
  sku: string | undefined,
  availability: Record<string, number | null>,
): boolean {
  if (!sku || !Object.prototype.hasOwnProperty.call(availability, sku)) {
    return true;
  }
  const qty = availability[sku];
  return qty === null || qty === undefined || qty > 0;
}

function schemaAvailabilityForSku(
  sku: string | undefined,
  availability: Record<string, number | null>,
): string {
  return isSkuInStock(sku, availability) ? IN_STOCK : OUT_OF_STOCK;
}

function schemaAvailabilityForProduct(
  product: Product,
  availability: Record<string, number | null>,
): string {
  const anyInStock = product.variants.some((variant) =>
    isSkuInStock(variant.sku, availability),
  );
  return anyInStock ? IN_STOCK : OUT_OF_STOCK;
}
