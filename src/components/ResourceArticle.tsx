import Link from "next/link";
import type { ResourcePage } from "@/data/resources";
import { resourcePages } from "@/data/resources";

type ResourceArticleProps = {
  page: ResourcePage;
};

export function ResourceArticle({ page }: ResourceArticleProps) {
  const others = resourcePages.filter((entry) => entry.slug !== page.slug);

  return (
    <div>
      <section className="border-b border-line bg-bg-elevated">
        <div className="site-shell py-20 sm:py-24">
          <p className="label">{page.eyebrow}</p>
          <h1 className="font-display mt-5 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            {page.headline}
          </h1>
          <p className="mt-8 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
            {page.lede}
          </p>
          {page.notice ? (
            <aside
              className="mt-8 max-w-2xl border border-line bg-bg px-5 py-4"
              aria-label={page.notice.title}
            >
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink">
                {page.notice.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {page.notice.body}
              </p>
            </aside>
          ) : null}
        </div>
      </section>

      <div className="site-shell grid gap-14 py-20 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
          <div>
            <p className="label">In this guide</p>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              {page.sections.map((section) => (
                <li key={section.heading}>
                  <a
                    href={`#${sectionAnchor(section.heading)}`}
                    className="transition hover:text-ink"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">Catalog</p>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              {page.catalogLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">More resources</p>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              <li>
                <Link href="/resources" className="transition hover:text-ink">
                  All resources
                </Link>
              </li>
              {others.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={`/resources/${entry.slug}`}
                    className="transition hover:text-ink"
                  >
                    {entry.navLabel}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <article className="max-w-2xl space-y-12">
          {page.sections.map((section) => (
            <section
              key={section.heading}
              id={sectionAnchor(section.heading)}
              className="scroll-mt-28"
            >
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="mt-4 text-[1.02rem] leading-relaxed text-ink-soft"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <section className="border-t border-line pt-10">
            <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              References
            </h2>
            <ul className="mt-4 space-y-3">
              {page.citations.map((citation) => (
                <li key={citation.href} className="text-sm leading-relaxed">
                  <a
                    href={citation.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink underline decoration-line underline-offset-4 transition hover:text-ink-soft"
                  >
                    {citation.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </div>
    </div>
  );
}

function sectionAnchor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
