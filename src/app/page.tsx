import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { products } from "@/data/products";
import { operatingNotes, site } from "@/data/site";
import { pageMetadata } from "@/lib/seo/pageMetadata";

export const metadata: Metadata = pageMetadata({
  absoluteTitle: "Elevate Precision Health — Research Peptides & Lab Supplies",
  description:
    "Elevate Precision Health offers a focused catalog of research-only peptides, blends, and laboratory supplies, with lot documentation available on request. Research use only.",
  path: "/",
});

export default function HomePage() {
  const spotlight = products.filter((product) => product.featured);

  return (
    <>
      <section className="hero-banner relative min-h-[min(92vh,880px)] overflow-hidden">
        <div className="hero-banner-media" aria-hidden />
        <div className="hero-banner-scrim" aria-hidden />

        <div className="site-shell relative z-[2] flex min-h-[min(92vh,880px)] flex-col justify-end pb-16 pt-28 sm:pb-24">
          <h1 className="animate-rise font-display max-w-4xl text-[clamp(3rem,11vw,7rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-on-dark">
            Elevate
            <br />
            Precision
            <br />
            <span className="text-[color:var(--accent-soft)]">Health</span>
          </h1>
          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="animate-rise-delay max-w-md text-xl font-medium leading-snug text-on-dark sm:text-2xl">
                Precision peptide science for personalized wellness.
              </p>
              <p className="animate-rise-delay-2 mt-5 max-w-md text-[0.95rem] leading-relaxed text-[color:var(--on-dark-muted)]">
                A disciplined catalog. Lot-aware documentation. Support that
                stays precise.
              </p>
            </div>
            <div className="animate-rise-delay-2 lg:justify-self-end">
              <Link href="/products" className="btn btn-light btn-arrow">
                Browse products
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="site-shell grid md:grid-cols-3">
          {operatingNotes.map((note, index) => (
            <Reveal
              key={note.step}
              as="article"
              delayMs={index * 90}
              className={`note-card py-14 md:px-8 ${
                index > 0 ? "border-t border-line md:border-l md:border-t-0" : ""
              } ${index === 0 ? "md:pl-0" : ""} ${
                index === operatingNotes.length - 1 ? "md:pr-0" : ""
              }`}
            >
              <p className="note-step font-display text-sm font-semibold tracking-[0.2em] text-accent">
                {note.step}
              </p>
              <h2 className="font-display mt-8 text-2xl font-semibold tracking-tight text-ink">
                {note.title}
              </h2>
              <p className="mt-4 max-w-xs text-[0.95rem] leading-relaxed text-ink-soft">
                {note.body}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="site-shell grid gap-12 py-24 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <Reveal className="flex flex-col justify-between">
          <div>
            <p className="label">Documentation</p>
            <h2 className="font-display mt-5 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Paperwork belongs next to the vial
            </h2>
          </div>
          <p className="mt-10 max-w-md text-[0.95rem] leading-relaxed text-ink-soft lg:mt-16">
            Certificates stay attached to the lot. Request what you need, file
            it with your protocol, and skip ornamental trust claims.
          </p>
        </Reveal>
        <Reveal delayMs={120}>
          <div className="surface-grain relative overflow-hidden bg-panel px-8 py-10 text-on-dark sm:px-10 sm:py-12">
            <div className="relative z-[2]">
              <p className="label label-on-dark">Assays</p>
              <p className="mt-6 text-lg leading-relaxed text-[color:var(--on-dark-muted)]">
                Public downloads expand SKU by SKU. Until then, name the
                compound and lot — we send the file on record.
              </p>
              <Link
                href="/coa"
                className="btn btn-ghost btn-arrow mt-10 border-white/35 text-on-dark"
              >
                Assay policy
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="border-y border-line bg-bg-elevated py-24">
        <div className="site-shell">
          <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="label">Catalog</p>
              <h2 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                Featured products
              </h2>
            </div>
            <Link
              href="/products"
              className="link-underline text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft"
            >
              Browse products →
            </Link>
          </Reveal>

          <Reveal
            delayMs={100}
            className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
          >
            {spotlight.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </Reveal>
        </div>
      </section>

      <section className="site-shell py-24">
        <Reveal>
          <div className="grid gap-10 border border-line bg-bg-elevated p-8 transition duration-300 hover:border-ink/40 sm:p-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <p className="label">Institutions</p>
              <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Need a multi-lot plan?
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
        </Reveal>
      </section>
    </>
  );
}
