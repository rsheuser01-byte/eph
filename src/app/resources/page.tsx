import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { resourcePages } from "@/data/resources";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { breadcrumbSchema } from "@/lib/seo/structuredData";

export const metadata: Metadata = pageMetadata({
  title: "Resources",
  description:
    "Research-use guidance from Elevate Precision Health: RUO meaning, identity and purity verification, and reconstitution/storage practices for laboratory buyers.",
  path: "/resources",
});

export default function ResourcesIndexPage() {
  return (
    <div>
      <JsonLd
        data={breadcrumbSchema(getSiteUrl(), [
          { name: "Home", path: "/" },
          { name: "Resources", path: "/resources" },
        ])}
      />
      <section className="border-b border-line bg-bg-elevated">
        <div className="site-shell py-20 sm:py-24">
          <p className="label">Guides</p>
          <h1 className="font-display mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Research resources
          </h1>
          <p className="mt-8 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
            Short reference pages for qualified laboratory buyers — compliance
            framing, documentation expectations, and bench handling. Not medical
            advice.
          </p>
        </div>
      </section>

      <div className="site-shell py-20">
        <ul className="divide-y divide-line border-y border-line">
          {resourcePages.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/resources/${page.slug}`}
                className="group flex flex-col gap-3 py-8 transition sm:flex-row sm:items-baseline sm:justify-between"
              >
                <div className="max-w-2xl">
                  <p className="label">{page.eyebrow}</p>
                  <h2 className="font-display mt-3 text-2xl font-semibold tracking-tight text-ink group-hover:text-ink-soft">
                    {page.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {page.lede}
                  </p>
                </div>
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-accent">
                  Read →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
