import { describe, expect, it } from "vitest";
import type { Testimonial } from "@/data/testimonials";
import {
  MIN_RATED_REVIEWS_FOR_SCHEMA,
  canEmitReviewSchema,
} from "@/data/testimonials";
import { organizationReviewSchema } from "./structuredData";

const BASE = "https://www.elevateprecisionhealth.com";

function ratedFixture(count: number): Testimonial[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `t-${index}`,
    quote: `Vetted laboratory feedback note number ${index + 1} about ordering and documentation.`,
    attributionName: null,
    institutionType: "Research laboratory",
    region: null,
    publishedOn: "2026-07-01",
    rating: 5,
    vetted: true as const,
    productSlug: null,
  }));
}

describe("organizationReviewSchema", () => {
  it("returns null below the volume gate", () => {
    expect(
      organizationReviewSchema(BASE, ratedFixture(MIN_RATED_REVIEWS_FOR_SCHEMA - 1)),
    ).toBeNull();
    expect(canEmitReviewSchema(ratedFixture(4))).toBe(false);
  });

  it("emits Organization aggregateRating and reviews once volume justifies it", () => {
    const entries = ratedFixture(MIN_RATED_REVIEWS_FOR_SCHEMA);
    const schema = organizationReviewSchema(BASE, entries);
    expect(schema).not.toBeNull();
    expect(schema).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Organization",
      url: BASE,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        reviewCount: String(MIN_RATED_REVIEWS_FOR_SCHEMA),
        bestRating: "5",
        worstRating: "1",
      },
    });
    const reviews = schema!.review as Array<Record<string, unknown>>;
    expect(reviews).toHaveLength(MIN_RATED_REVIEWS_FOR_SCHEMA);
    expect(reviews[0]).toMatchObject({
      "@type": "Review",
      reviewBody: entries[0]!.quote,
      reviewRating: {
        "@type": "Rating",
        ratingValue: "5",
        bestRating: "5",
        worstRating: "1",
      },
    });
  });
});
