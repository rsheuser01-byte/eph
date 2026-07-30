import { describe, expect, it } from "vitest";
import { getProductBySlug } from "@/data/products";
import { site } from "@/data/site";
import { organizationSchema, productSchema } from "./structuredData";

const BASE = "https://www.elevateprecisionhealth.com";

describe("organizationSchema", () => {
  it("includes legal name, Louisville address, logo, and email contactPoint", () => {
    expect(organizationSchema(BASE)).toMatchObject({
      "@type": "Organization",
      name: site.name,
      legalName: "Elevate Precision Health LLC",
      email: site.email,
      logo: `${BASE}/images/logo-header-transparent.png`,
      address: {
        "@type": "PostalAddress",
        streetAddress: "3801 Billtown Rd",
        addressLocality: "Louisville",
        addressRegion: "KY",
        postalCode: "40299",
        addressCountry: "US",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: site.email,
        url: `${BASE}/contact`,
      },
    });
    expect(organizationSchema(BASE)).not.toHaveProperty("telephone");
    expect(organizationSchema(BASE)).not.toHaveProperty("sameAs");
    expect(
      (organizationSchema(BASE).address as Record<string, unknown>),
    ).not.toHaveProperty("postOfficeBoxNumber");
  });
});

describe("productSchema", () => {
  it("emits a single Offer for a one-variant product from catalog data", () => {
    const product = getProductBySlug("mt-2");
    expect(product).toBeDefined();
    const variant = product!.variants[0]!;

    const schema = productSchema(BASE, product!, {
      [variant.sku]: null,
    });

    expect(schema).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product!.name,
      sku: product!.sku,
      description: product!.shortDescription,
      category: product!.category,
      url: `${BASE}/products/mt-2`,
      image: `${BASE}${variant.image}`,
      brand: { "@type": "Brand", name: site.name },
      offers: {
        "@type": "Offer",
        url: `${BASE}/products/mt-2`,
        priceCurrency: "USD",
        price: variant.price.toFixed(2),
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          name: site.name,
          url: BASE,
        },
      },
    });
  });

  it("marks Offer OutOfStock when the variant quantity is zero", () => {
    const product = getProductBySlug("mt-2")!;
    const variant = product.variants[0]!;

    const schema = productSchema(BASE, product, {
      [variant.sku]: 0,
    });

    expect(schema.offers).toMatchObject({
      availability: "https://schema.org/OutOfStock",
    });
  });

  it("emits AggregateOffer with live low/high/count for multi-size products", () => {
    const product = getProductBySlug("glp-3");
    expect(product).toBeDefined();
    expect(product!.variants.length).toBeGreaterThan(1);

    const prices = product!.variants.map((v) => v.price);
    const low = Math.min(...prices);
    const high = Math.max(...prices);

    const availability = Object.fromEntries(
      product!.variants.map((v) => [v.sku, null]),
    );
    const schema = productSchema(BASE, product!, availability);

    expect(schema).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product!.name,
      sku: product!.sku,
      description: product!.shortDescription,
      category: product!.category,
      url: `${BASE}/products/glp-3`,
      image: `${BASE}${product!.variants[0]!.image}`,
      brand: { "@type": "Brand", name: site.name },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: low.toFixed(2),
        highPrice: high.toFixed(2),
        offerCount: String(product!.variants.length),
        availability: "https://schema.org/InStock",
        url: `${BASE}/products/glp-3`,
      },
    });
    // Real catalog range must not collapse to a duplicated single price.
    expect(low).toBeLessThan(high);
    expect((schema.offers as Record<string, string>).lowPrice).not.toBe(
      (schema.offers as Record<string, string>).highPrice,
    );
  });

  it("marks AggregateOffer OutOfStock only when every variant is at zero", () => {
    const product = getProductBySlug("glp-3")!;
    const allOut = Object.fromEntries(
      product.variants.map((v) => [v.sku, 0]),
    );
    const mixed = {
      ...allOut,
      [product.variants[0]!.sku]: 2,
    };

    expect(
      (productSchema(BASE, product, allOut).offers as Record<string, string>)
        .availability,
    ).toBe("https://schema.org/OutOfStock");

    expect(
      (productSchema(BASE, product, mixed).offers as Record<string, string>)
        .availability,
    ).toBe("https://schema.org/InStock");
  });
});
