import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { breadcrumbSchema } from "@/lib/seo/structuredData";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "About Elevate Precision Health — a focused supplier of research-only peptides, blends, and laboratory supplies for qualified researchers and institutions.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div>
      <JsonLd
        data={breadcrumbSchema(getSiteUrl(), [
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <section className="border-b border-line bg-bg-elevated">
        <div className="site-shell py-20 sm:py-24">
          <p className="label">Approach</p>
          <h1 className="font-display mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Fewer SKUs. Clearer answers. Less theater.
          </h1>
        </div>
      </section>

      <div className="site-shell grid gap-14 py-20 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <p className="label">Optimize for</p>
          <ul className="space-y-4 text-[0.95rem] text-ink-soft">
            <li className="border-l-2 border-ink pl-4 transition hover:translate-x-0.5">
              Repeatable purchasing
            </li>
            <li className="border-l-2 border-line pl-4 transition hover:translate-x-0.5 hover:border-ink">
              Lot-level paperwork
            </li>
            <li className="border-l-2 border-line pl-4 transition hover:translate-x-0.5 hover:border-ink">
              Direct replies
            </li>
          </ul>
        </aside>

        <div className="max-w-2xl space-y-6 text-[1.02rem] leading-relaxed text-ink-soft">
          <p>
            {site.name} is for researchers who already know what they need and
            want a supplier that keeps the process calm. We do not chase every
            trend compound online.
          </p>
          <p>
            Inventory stays intentionally short. Each listing is meant to be
            clear at a glance — category, size range, and a path to request the
            assay file for the lot you care about.
          </p>
          <p>
            Planning a larger study or recurring cadence? Tell us the schedule.
            We would rather plan with you than surprise you with stockouts.
          </p>

          <div className="flex flex-col gap-3 pt-6 sm:flex-row">
            <Link href="/products" className="btn btn-primary btn-arrow">
              Browse products
            </Link>
            <Link href="/contact" className="btn btn-ghost border-ink text-ink">
              Ask a question
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
