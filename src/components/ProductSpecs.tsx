import { productSpecRows, type Product } from "@/data/products";
import { getProductAssaySignals } from "@/data/coa";
import { productContentUpdatedOn } from "@/data/contentDates";
import { LastUpdated } from "@/components/LastUpdated";
import { molecularFormulaParts } from "@/lib/chemistry/molecularFormula";
import { buildProductSpecSections } from "@/lib/products/productSpecQuestions";

type ProductSpecsProps = {
  product: Product;
};

export function ProductSpecs({ product }: ProductSpecsProps) {
  const rows = productSpecRows(product);
  const sections = buildProductSpecSections(product);
  const assay = getProductAssaySignals(product.slug);
  const assayRows =
    product.category === "Supply"
      ? []
      : [
          assay.purity ? { label: "Lot purity", value: assay.purity } : null,
          assay.testMethods
            ? { label: "Test methods", value: assay.testMethods }
            : null,
          assay.testingLabName
            ? {
                label: assay.hasPublishedCoa
                  ? "Third-party lab"
                  : "Analytical partner",
                value: assay.testingLabName,
              }
            : null,
        ].filter((row): row is { label: string; value: string } => row !== null);
  const allRows = [...assayRows, ...rows];
  const [primary, ...rest] = sections;
  const attributeSection = rest.find(
    (section) => section.id === "product-specs-attributes",
  );
  const middle = rest.filter(
    (section) => section.id !== "product-specs-attributes",
  );

  return (
    <section
      className="mt-20 border-t border-line pt-14"
      aria-labelledby={primary?.id ?? "product-specs"}
    >
      <p className="label">Specifications</p>

      {primary ? (
        <div className="mt-4 max-w-2xl">
          <h2
            id={primary.id}
            className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
          >
            {primary.question}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            {primary.answer}
          </p>
        </div>
      ) : null}

      {middle.map((section) => (
        <div key={section.id} className="mt-8 max-w-2xl">
          <h3
            id={section.id}
            className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl"
          >
            {section.question}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {section.answer}
          </p>
        </div>
      ))}

      <LastUpdated
        date={productContentUpdatedOn(product)}
        label="Specs last updated"
        className="mt-6"
      />

      {attributeSection ? (
        <div className="mt-10 max-w-2xl">
          <h3
            id={attributeSection.id}
            className="font-display text-lg font-semibold tracking-tight text-ink sm:text-xl"
          >
            {attributeSection.question}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {attributeSection.answer}
          </p>
        </div>
      ) : null}

      <dl className="mt-6 border-t border-ink/20">
        {allRows.map((row) => (
          <div
            key={row.label}
            className="grid gap-2 border-b border-line py-5 sm:grid-cols-[14rem_1fr] sm:gap-8"
          >
            <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-soft">
              {row.label}
            </dt>
            <dd className="text-sm leading-relaxed text-ink">
              {row.label === "Molecular formula" ? (
                <MolecularFormula value={row.value} />
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function MolecularFormula({ value }: { value: string }) {
  return (
    <span className="font-medium tracking-wide">
      {molecularFormulaParts(value).map((part, index) =>
        part.kind === "sub" ? (
          <sub key={`${part.kind}-${index}`}>{part.value}</sub>
        ) : (
          <span key={`${part.kind}-${index}`}>{part.value}</span>
        ),
      )}
    </span>
  );
}
