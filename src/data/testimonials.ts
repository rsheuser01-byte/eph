/**
 * Vetted laboratory / institutional testimonials (Phase 3 #4).
 *
 * Rules:
 * - Do not invent quotes, names, labs, or star ratings.
 * - Only append entries after manual vetting (`vetted: true`).
 * - Prefer institution-type attribution when the buyer wants anonymity.
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
 * Published testimonials. Start empty until real vetted notes exist —
 * empty is preferable to fabricated social proof in this niche.
 */
export const testimonials: readonly Testimonial[] = [];

export function publishedTestimonials(
  entries: readonly Testimonial[] = testimonials,
): Testimonial[] {
  return entries.filter((entry) => entry.vetted);
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
