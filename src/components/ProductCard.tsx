import Link from "next/link";
import { formatPrice, type Product } from "@/data/products";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="product-row group grid grid-cols-1 items-start gap-3 border-b border-line py-7 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1.7fr)_13rem] sm:gap-8 sm:px-3"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="product-name font-display text-xl font-semibold tracking-tight text-ink">
          {product.name}
        </h3>
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          {product.category}
        </span>
      </div>
      <p className="text-[0.9375rem] leading-relaxed text-ink-soft">
        {product.shortDescription}
      </p>
      <div className="flex items-center justify-between gap-5 sm:justify-end">
        <span className="text-sm font-semibold tabular-nums text-ink">
          {formatPrice(product)}
        </span>
        <span className="product-open text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-accent group-hover:text-ink">
          Open →
        </span>
      </div>
    </Link>
  );
}
