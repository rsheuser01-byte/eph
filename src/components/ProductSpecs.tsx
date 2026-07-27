import { productSpecRows, type Product } from "@/data/products";
import { molecularFormulaParts } from "@/lib/chemistry/molecularFormula";

type ProductSpecsProps = {
  product: Product;
};

export function ProductSpecs({ product }: ProductSpecsProps) {
  const rows = productSpecRows(product);

  return (
    <section className="mt-20 border-t border-line pt-14" aria-labelledby="product-specs">
      <p className="label">Specifications</p>
      <h2
        id="product-specs"
        className="font-display mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl"
      >
        Research details
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Laboratory reference attributes for {product.name}. Research use only —
        not for human or veterinary use.
      </p>

      <dl className="mt-10 border-t border-ink/20">
        {rows.map((row) => (
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
