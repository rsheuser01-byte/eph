import Link from "next/link";
import { site } from "@/data/site";

type InstitutionalCtaProps = {
  /** Full homepage-style block, or compact strip for product templates. */
  variant?: "full" | "compact";
  className?: string;
};

export function InstitutionalCta({
  variant = "full",
  className = "",
}: InstitutionalCtaProps) {
  if (variant === "compact") {
    return (
      <aside
        className={`border-t border-line pt-10 ${className}`.trim()}
        aria-labelledby="bulk-orders-cta"
      >
        <h2
          id="bulk-orders-cta"
          className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl"
        >
          We can place bulk orders
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
          Send quantities and preferred SKUs — we reply with availability and
          paperwork notes.
        </p>
        <Link
          href="/contact"
          className="link-underline mt-5 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft"
        >
          Start a conversation →
        </Link>
      </aside>
    );
  }

  return (
    <section
      className={`site-shell py-24 ${className}`.trim()}
      aria-labelledby="bulk-orders-cta"
    >
      <div className="grid gap-10 border border-line bg-bg-elevated p-8 transition duration-300 hover:border-ink/40 sm:p-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
        <div>
          <h2
            id="bulk-orders-cta"
            className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          >
            We can place bulk orders
          </h2>
          <p className="mt-5 max-w-lg text-[0.95rem] leading-relaxed text-ink-soft">
            Send quantities and preferred SKUs. We reply with availability,
            paperwork notes, and a direct path to order.
          </p>
        </div>
        <div className="lg:text-right">
          <Link href="/contact" className="btn btn-primary btn-arrow">
            Start a conversation
          </Link>
          <p className="mt-4 text-xs font-medium tracking-wide text-ink-soft">
            {site.shippingNote}
          </p>
        </div>
      </div>
    </section>
  );
}
