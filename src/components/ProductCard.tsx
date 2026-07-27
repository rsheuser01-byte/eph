import Image from "next/image";
import Link from "next/link";
import {
  formatPrice,
  productPrimaryImage,
  type Product,
} from "@/data/products";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const image = productPrimaryImage(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="product-card group flex flex-col"
    >
      <div className="product-card-media relative aspect-square overflow-hidden border border-line bg-white">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="mt-5 flex flex-1 flex-col gap-2">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          {product.category}
        </span>
        <h3 className="product-name font-display text-xl font-semibold tracking-tight text-ink">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">
          {product.shortDescription}
        </p>
        <div className="mt-auto flex items-baseline justify-between gap-4 pt-3">
          <span className="text-sm font-semibold tabular-nums text-ink">
            {formatPrice(product)}
          </span>
          <span className="product-open text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-accent group-hover:text-ink">
            Open →
          </span>
        </div>
      </div>
    </Link>
  );
}
