import Link from "next/link";
import {
  publishedTestimonials,
  type Testimonial,
} from "@/data/testimonials";

type TestimonialsSectionProps = {
  /** Optional override for tests or alternate placements. */
  entries?: readonly Testimonial[];
};

export function TestimonialsSection({
  entries,
}: TestimonialsSectionProps = {}) {
  const published = publishedTestimonials(entries);

  return (
    <section
      className="border-b border-line py-24"
      aria-labelledby="lab-notes"
    >
      <div className="site-shell">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="label">Lab notes</p>
            <h2
              id="lab-notes"
              className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl"
            >
              How research buyers describe working with us
            </h2>
            <p className="mt-5 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft">
              Short, manually vetted notes from laboratories and institutions —
              focused on ordering, documentation, and support. We do not publish
              invented reviews or star ratings.
            </p>
          </div>
          <Link
            href="/contact?topic=lab-feedback"
            className="link-underline text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft"
          >
            Share lab feedback →
          </Link>
        </div>

        {published.length > 0 ? (
          <ul className="mt-14 divide-y divide-line border-y border-line">
            {published.map((entry) => (
              <li key={entry.id} className="py-8 sm:py-10">
                <blockquote className="max-w-2xl">
                  <p className="text-[1.05rem] leading-relaxed text-ink">
                    “{entry.quote}”
                  </p>
                  <footer className="mt-4 text-sm text-ink-soft">
                    <cite className="not-italic font-medium text-ink">
                      {formatAttribution(entry)}
                    </cite>
                    {entry.region ? (
                      <span className="before:mx-2 before:content-['·']">
                        {entry.region}
                      </span>
                    ) : null}
                  </footer>
                </blockquote>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-12 max-w-xl border-t border-line pt-8 text-sm leading-relaxed text-ink-soft">
            No vetted notes are published yet. If your lab has ordered and you
            want to share how documentation or fulfillment worked for a
            protocol, send a short note through contact — we only post what we
            can stand behind.
          </p>
        )}
      </div>
    </section>
  );
}

function formatAttribution(entry: Testimonial): string {
  if (entry.attributionName) {
    return `${entry.attributionName}, ${entry.institutionType}`;
  }
  return entry.institutionType;
}
