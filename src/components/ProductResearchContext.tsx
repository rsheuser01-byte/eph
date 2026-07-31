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
  return (
    <section
      className="mt-20 border-t border-line pt-14"
      aria-labelledby="product-research"
    >
      <p className="label">Research context</p>
      <h2
        id="product-research"
        className="font-display mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
      >
        Laboratory background for {productName}
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Brief reference notes for qualified researchers. Research use only — not
        for human or veterinary use.
      </p>

      <div className="mt-10 max-w-2xl space-y-10">
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
      </div>

      {research.citations.length > 0 ? (
        <div className="mt-12 max-w-2xl border-t border-line pt-8">
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
                  className="text-ink underline decoration-line underline-offset-4 transition hover:text-ink-soft"
                >
                  {citation.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
