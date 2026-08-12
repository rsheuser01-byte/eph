import { describe, expect, it } from "vitest";
import {
  MIN_RATED_REVIEWS_FOR_SCHEMA,
  canEmitReviewSchema,
  publishedTestimonials,
  ratedTestimonials,
  testimonials,
  testimonialHasProhibitedClaim,
  type Testimonial,
} from "./testimonials";

describe("testimonials (Phase 3 #4)", () => {
  it("only publishes vetted entries without prohibited human-use claims", () => {
    for (const entry of testimonials) {
      expect(entry.vetted).toBe(true);
      expect(entry.quote.trim().length).toBeGreaterThan(20);
      expect(entry.institutionType.trim().length).toBeGreaterThan(0);
      expect(entry.publishedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(testimonialHasProhibitedClaim(entry.quote)).toBe(false);
      if (entry.rating !== null) {
        expect(entry.rating).toBeGreaterThanOrEqual(1);
        expect(entry.rating).toBeLessThanOrEqual(5);
      }
    }
    expect(publishedTestimonials()).toEqual(
      testimonials.filter(
        (entry) => entry.vetted && !testimonialHasProhibitedClaim(entry.quote),
      ),
    );
  });

  it("filters human-benefit quotes even when marked vetted", () => {
    const blocked: Testimonial = {
      id: "bad",
      quote: "Helped with my weight loss after two weeks.",
      attributionName: null,
      institutionType: "Independent lab",
      region: null,
      publishedOn: "2026-01-01",
      rating: 5,
      vetted: true,
      productSlug: null,
    };
    expect(testimonialHasProhibitedClaim(blocked.quote)).toBe(true);
    expect(publishedTestimonials([blocked])).toEqual([]);
  });

  it("keeps aggregateRating/review schema gated until volume justifies it", () => {
    expect(MIN_RATED_REVIEWS_FOR_SCHEMA).toBeGreaterThanOrEqual(5);
    expect(canEmitReviewSchema(testimonials)).toBe(
      ratedTestimonials(testimonials).length >= MIN_RATED_REVIEWS_FOR_SCHEMA,
    );
  });
});
