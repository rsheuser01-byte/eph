import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import {
  coaDownloadFiles,
  listPublishedCoas,
  productsWithoutPublishedCoa,
} from "@/data/coa";
import { site } from "@/data/site";
import { trustSignals } from "@/data/trustSignals";
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
  const published = listPublishedCoas();
  const pending = productsWithoutPublishedCoa();

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
            Identity first. Purity next. Files where they belong.
          </h1>
          <p className="mt-8 max-w-lg text-[0.95rem] leading-relaxed text-[color:var(--on-dark-muted)]">
            Download certificates already on file from product pages or below,
            or email for a lot that is not listed yet. For how we think about
            identity versus purity, see{" "}
            <Link
              href="/resources/identity-and-purity"
              className="text-on-dark underline decoration-white/30 underline-offset-4 transition hover:decoration-white"
            >
              How we verify identity and purity
            </Link>
            .
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
            {trustSignals.testingLabName ? (
              <li className="flex gap-5">
                <span className="font-display text-sm font-semibold tracking-[0.18em] text-accent">
                  04
                </span>
                <span className="pt-0.5 text-sm leading-relaxed text-ink-soft">
                  Manufacturing and analytical partner:{" "}
                  {trustSignals.testingLabUrl ? (
                    <a
                      href={trustSignals.testingLabUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink underline decoration-line underline-offset-4 transition hover:decoration-ink"
                    >
                      {trustSignals.testingLabName}
                    </a>
                  ) : (
                    trustSignals.testingLabName
                  )}
                </span>
              </li>
            ) : null}
          </ol>
        </div>

        <div className="space-y-8">
          <div className="border border-line bg-bg-elevated p-8 sm:p-10">
            <p className="label">Downloads</p>
            <h2 className="font-display mt-4 text-2xl font-semibold tracking-tight text-ink">
              Certificates on file
            </h2>
            {published.length > 0 ? (
              <ul className="mt-6 space-y-4">
                {published.map((doc) => {
                  const files = coaDownloadFiles(doc);
                  return (
                    <li key={doc.productSlug}>
                      <p className="text-sm font-semibold text-ink">
                        {doc.productName}
                      </p>
                      <div className="mt-2 flex flex-col gap-1.5">
                        {files.map((file) => (
                          <a
                            key={file.href}
                            href={file.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-underline text-sm text-ink"
                          >
                            {files.length === 1
                              ? "View PDF"
                              : file.label}{" "}
                            →
                          </a>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">
                        {[
                          doc.purity ? `${doc.purity} purity` : null,
                          doc.testMethods,
                          doc.testingLabName,
                          doc.note,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                No public downloads yet.
              </p>
            )}
          </div>

          <div className="border border-line bg-bg-elevated p-8 sm:p-10">
            <p className="label">Request</p>
            <h2 className="font-display mt-4 text-2xl font-semibold tracking-tight text-ink">
              Need another lot or SKU?
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Public files are expanding SKU by SKU. For products not listed
              above
              {pending.length > 0
                ? ` (${pending.map((item) => item.name).join(", ")})`
                : ""}
              , email the compound and lot to{" "}
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
    </div>
  );
}
