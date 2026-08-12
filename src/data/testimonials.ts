/**
 * Vetted laboratory / institutional testimonials (Phase 3 #4).
 *
 * Rules:
 * - Do not invent quotes, names, labs, or star ratings.
 * - Only append entries after manual vetting (`vetted: true`).
 * - Prefer institution-type attribution when the buyer wants anonymity.
 * - Reject quotes that imply human/veterinary use, dosing, or personal results.
 * - `aggregateRating` / `Review` JSON-LD stays off until rated volume justifies it.
 */

export type Testimonial = {
  id: string;
  quote: string;
  /** Display name or initials; null = institution-type attribution only. */
  attributionName: string | null;
  /** e.g. "University research lab", "Contract research organization". */
  institutionType: string;
  /** Optional coarse region (e.g. "US"); null when omitted. */
  region: string | null;
  /** ISO date the quote was approved for the site. */
  publishedOn: string;
  /** 1–5 only when a real rating was collected; otherwise null. */
  rating: number | null;
  /** Must be true to publish — unverified drafts do not belong here. */
  vetted: true;
  /** Optional catalog slug when the note is about a specific SKU. */
  productSlug: string | null;
};

/** Minimum rated, vetted reviews before Organization review schema may emit. */
export const MIN_RATED_REVIEWS_FOR_SCHEMA = 5;

/**
 * Quotes implying human/veterinary outcomes must never render, even if marked
 * vetted by mistake. Acceptable themes: shipping, packaging, support, COA,
 * ordering, and laboratory handling that does not imply administration.
 */
const PROHIBITED_TESTIMONIAL_CLAIM =
  /\b(weight\s*loss|lose\s*weight|appetite|obesity|fat\s*loss|heal(?:ing|ed|s)?|recover(?:y|ed)|pain\s*relief|diabetes|blood\s*sugar|anti[-\s]?aging|libido|sexual|muscle\s*growth|dosing|dose|inject(?:ion|ed|ing)?|administer(?:ed|ing)?|human\s*use|personal\s*use|treated\s*my|cured)\b/i;

export function testimonialHasProhibitedClaim(quote: string): boolean {
  return PROHIBITED_TESTIMONIAL_CLAIM.test(quote);
}

/**
 * Published testimonials. Start empty until real vetted notes exist —
 * empty is preferable to fabricated social proof in this niche.
 */
export const testimonials: readonly Testimonial[] = [];

export function publishedTestimonials(
  entries: readonly Testimonial[] = testimonials,
): Testimonial[] {
  return entries.filter(
    (entry) => entry.vetted && !testimonialHasProhibitedClaim(entry.quote),
  );
}

export function ratedTestimonials(
  entries: readonly Testimonial[] = testimonials,
): Testimonial[] {
  return publishedTestimonials(entries).filter(
    (entry) => entry.rating !== null,
  );
}

export function canEmitReviewSchema(
  entries: readonly Testimonial[] = testimonials,
): boolean {
  return ratedTestimonials(entries).length >= MIN_RATED_REVIEWS_FOR_SCHEMA;
}

export function averageRating(
  entries: readonly Testimonial[] = testimonials,
): number | null {
  const rated = ratedTestimonials(entries);
  if (rated.length === 0) {
    return null;
  }
  const sum = rated.reduce((total, entry) => total + (entry.rating ?? 0), 0);
  return sum / rated.length;
}
