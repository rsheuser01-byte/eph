import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { breadcrumbSchema } from "@/lib/seo/structuredData";

export const metadata: Metadata = pageMetadata({
  title: "Certificates of Analysis",
  description:
    "How Elevate Precision Health handles certificates of analysis and lot documentation for its research-only catalog.",
  path: "/coa",
});

export default function CoaPage() {
  return (
    <div>
      <JsonLd
        data={breadcrumbSchema(getSiteUrl(), [
          { name: "Home", path: "/" },
          { name: "Certificates of Analysis", path: "/coa" },
        ])}
      />
      <section className="hero-ascetic surface-grain">
        <div className="site-shell relative z-[2] py-20 sm:py-24">
          <p className="label label-on-dark">Assays</p>
          <h1 className="font-display mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-on-dark sm:text-6xl">
            Identity first. Purity next. File on request.
          </h1>
          <p className="mt-8 max-w-lg text-[0.95rem] leading-relaxed text-[color:var(--on-dark-muted)]">
            Certificate access stays practical: ask for the lot, receive the
            paperwork that belongs with it.
          </p>
        </div>
      </section>

      <div className="site-shell grid gap-14 py-20 lg:grid-cols-2">
        <div>
          <p className="label">Verification</p>
          <ol className="mt-8 space-y-8">
            {[
              "Compound identity against the labeled research product",
              "Purity suitable for laboratory protocols",
              "Lot continuity so reorders stay comparable",
            ].map((item, index) => (
              <li key={item} className="flex gap-5">
                <span className="font-display text-sm font-semibold tracking-[0.18em] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="pt-0.5 text-sm leading-relaxed text-ink-soft">
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="border border-line bg-bg-elevated p-8 sm:p-10">
          <p className="label">Request</p>
          <h2 className="font-display mt-4 text-2xl font-semibold tracking-tight text-ink">
            Get a certificate
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            Public downloads are rolling out by SKU. Until then, email the
            compound and lot to{" "}
            <a
              href={`mailto:${site.email}`}
              className="text-ink underline decoration-line underline-offset-4 transition hover:decoration-ink"
            >
              {site.email}
            </a>
            .
          </p>
          <Link
            href="/products"
            className="btn btn-primary btn-arrow mt-10"
          >
            Products
          </Link>
        </div>
      </div>
    </div>
  );
}
