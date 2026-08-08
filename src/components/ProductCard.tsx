import Link from "next/link";
import { ProductAssaySignals } from "@/components/ProductAssaySignals";
import { ProductCardImage } from "@/components/ProductCardImage";
import {
  formatPrice,
  productImageAlt,
  productPrimaryImage,
  type Product,
} from "@/data/products";

type ProductCardProps = {
  product: Product;
  /** Mark the LCP candidate (first above-the-fold card) for early fetch. */
  priority?: boolean;
  /** Fetch immediately even when below the fold (homepage catalog). */
  eager?: boolean;
  /** Denser tile for homepage grids — drops description and assay chrome. */
  compact?: boolean;
  /** Stagger image fade-in (homepage catalog phases). */
  fadeDelayMs?: number;
};

export function ProductCard({
  product,
  priority = false,
  eager = false,
  compact = false,
  fadeDelayMs = 0,
}: ProductCardProps) {
  const image = productPrimaryImage(product);
  const showAssay = !compact && product.category !== "Supply";

  return (
    <article
      className={`product-card group flex flex-col${compact ? " product-card-compact" : ""}`}
    >
      <Link
        href={`/products/${product.slug}`}
        className="flex flex-1 flex-col"
      >
        <div
          className={`product-card-media relative overflow-hidden border border-line bg-white ${
            compact ? "aspect-[5/6]" : "aspect-square"
          }`}
        >
          {image ? (
            <ProductCardImage
              src={image}
              alt={productImageAlt(product)}
              priority={priority}
              eager={eager}
              compact={compact}
              fadeDelayMs={fadeDelayMs}
              sizes={
                compact
                  ? "(max-width: 639px) 42vw, (max-width: 1023px) 30vw, 280px"
                  : "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
              }
            />
          ) : null}
        </div>
        <div
          className={`flex flex-1 flex-col ${
            compact ? "mt-3 gap-1" : "mt-5 gap-2"
          }`}
        >
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            {product.category}
          </span>
          <h3
            className={`product-name font-display font-semibold tracking-tight text-ink ${
              compact
                ? "text-[0.95rem] leading-snug sm:text-lg"
                : "text-xl"
            }`}
          >
            {product.name}
          </h3>
          {!compact ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">
              {product.shortDescription}
            </p>
          ) : null}
          <div
            className={`mt-auto flex items-baseline justify-between gap-3 ${
              compact ? "pt-2" : "gap-4 pt-3"
            }`}
          >
            <span
              className={`font-semibold tabular-nums text-ink ${
                compact ? "text-xs sm:text-sm" : "text-sm"
              }`}
            >
              {formatPrice(product)}
            </span>
            <span className="product-open text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-accent group-hover:text-ink">
              Open →
            </span>
          </div>
        </div>
      </Link>
      {showAssay ? (
        <ProductAssaySignals productSlug={product.slug} variant="card" />
      ) : null}
    </article>
  );
}
