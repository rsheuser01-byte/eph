"use client";

import { useId, useState } from "react";
import {
  getProductResearch,
  type ProductResearchContext as ResearchContextData,
} from "@/data/productResearch";

type ProductResearchContextProps = {
  productSlug: string;
  productName: string;
};

export function ProductResearchContext({
  productSlug,
  productName,
}: ProductResearchContextProps) {
  const research = getProductResearch(productSlug);
  if (!research) {
    return null;
  }

  return <ResearchContextBlock research={research} productName={productName} />;
}

function ResearchContextBlock({
  research,
  productName,
}: {
  research: ResearchContextData;
  productName: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const panelId = useId();
  const headingId = "product-research";

  return (
    <section
      className="mt-20 border-t border-line pt-14"
      aria-labelledby={headingId}
    >
      <p className="label">Research interest</p>
      <h2
        id={headingId}
        className="font-display mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
      >
        Why researchers are interested
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Brief notes on why {productName} appears in laboratory study designs.
        Research use only — not for human or veterinary use.
      </p>

      <ul className="mt-8 max-w-2xl list-disc space-y-3 pl-5 text-sm leading-relaxed text-ink-soft">
        {research.interestPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      <div className="mt-10 max-w-2xl border-t border-line">
        <button
          type="button"
          className="faq-trigger flex w-full items-center justify-between gap-4 py-5 text-left transition hover:bg-bg-elevated/90"
          aria-expanded={detailsOpen}
          aria-controls={panelId}
          onClick={() => setDetailsOpen((open) => !open)}
        >
          <span className="text-[0.95rem] font-semibold tracking-tight text-ink">
            Research details and references
          </span>
          <span
            className="faq-icon font-display text-xl leading-none text-accent"
            aria-hidden
          >
            +
          </span>
        </button>
        <div
          id={panelId}
          className="faq-panel"
          data-open={detailsOpen}
          role="region"
          aria-label="Research details and references"
        >
          <div className="faq-panel-inner">
            <div className="space-y-10 pb-6" inert={!detailsOpen}>
              {research.sections.map((section) => (
                <div key={section.heading}>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                    {section.heading}
                  </h3>
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 48)}
                      className="mt-3 text-sm leading-relaxed text-ink-soft"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              ))}

              {research.citations.length > 0 ? (
                <div className="border-t border-line pt-8">
                  <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                    References
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {research.citations.map((citation) => (
                      <li key={citation.href} className="text-sm leading-relaxed">
                        <a
                          href={citation.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          tabIndex={detailsOpen ? undefined : -1}
                          className="text-ink underline decoration-line underline-offset-4 transition hover:text-ink-soft"
                        >
                          {citation.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
