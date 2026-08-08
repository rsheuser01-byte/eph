import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { InstitutionalCta } from "@/components/InstitutionalCta";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { products } from "@/data/products";
import { operatingNotes } from "@/data/site";
import { pageMetadata } from "@/lib/seo/pageMetadata";

export const metadata: Metadata = pageMetadata({
  absoluteTitle: "Elevate Precision Health — Research Peptides & Lab Supplies",
  description:
    "Elevate Precision Health offers a focused catalog of research-only peptides, blends, and laboratory supplies, with lot certificates on product pages and by request. Research use only.",
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <section className="hero-banner relative min-h-[min(78vh,720px)] overflow-hidden">
        <div className="hero-banner-media" aria-hidden>
          <Image
            src="/images/hero-banner.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="hero-banner-scrim" aria-hidden />

        <div className="site-shell relative z-[2] flex min-h-[min(78vh,720px)] flex-col justify-center pb-16 pt-24 sm:pb-20 sm:pt-28">
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
                Precision peptide science for disciplined laboratory research.
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

      <section className="border-b border-line bg-bg-elevated py-14 sm:py-16">
        <div className="site-shell">
          <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="label">Catalog</p>
              <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Research catalog
              </h2>
            </div>
            <Link
              href="/products"
              className="link-underline text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft"
            >
              Full product pages →
            </Link>
          </Reveal>

          <Reveal
            delayMs={80}
            className="mt-8 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-3"
          >
            {products.map((product, index) => (
              <ProductCard
                key={product.slug}
                product={product}
                compact
                priority={index < 4}
              />
            ))}
          </Reveal>
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
            Where a certificate is on file, open it from the product page.
            For lots still rolling out, email the compound and we send what we
            have — no ornamental trust claims.
          </p>
        </Reveal>
        <Reveal delayMs={120}>
          <div className="surface-grain relative overflow-hidden bg-panel px-8 py-10 text-on-dark sm:px-10 sm:py-12">
            <div className="relative z-[2]">
              <p className="label label-on-dark">Assays</p>
              <p className="mt-6 text-lg leading-relaxed text-[color:var(--on-dark-muted)]">
                Public downloads are live for growing parts of the catalog.
                Browse product pages or the certificates library; for SKUs not
                listed yet, name the compound and lot and we send the file on
                record.
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

      <TestimonialsSection />

      <Reveal>
        <InstitutionalCta />
      </Reveal>
    </>
  );
}
