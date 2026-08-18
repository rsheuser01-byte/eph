import Image from "next/image";
import Link from "next/link";
import { RelatedProductPurchase } from "@/components/RelatedProductPurchase";
import {
  productImageAlt,
  productPrimaryImage,
} from "@/data/products";
import {
  RELATED_RESOURCE_LINKS,
  type RelatedProduct,
} from "@/data/relatedProducts";

type RelatedProductsProps = {
  items: RelatedProduct[];
  /** sku -> qty on hand for related variants. */
  availability?: Record<string, number | null>;
};

export function RelatedProducts({
  items,
  availability = {},
}: RelatedProductsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className="mt-20 border-t border-line pt-14"
      aria-labelledby="related-products"
    >
      <h2 id="related-products" className="label">
        Related research materials
      </h2>

      <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2">
        {items.map((item) => {
          const image = productPrimaryImage(item.product);
          return (
            <li key={item.product.slug} className="flex gap-5">
              <Link
                href={`/products/${item.product.slug}`}
                className="relative aspect-square w-32 shrink-0 overflow-hidden border border-line bg-white transition hover:opacity-90 sm:w-40"
              >
                {image ? (
                  <Image
                    src={image}
                    alt={productImageAlt(item.product)}
                    fill
                    sizes="(max-width: 639px) 128px, 160px"
                    className="object-contain object-center scale-[1.35]"
                  />
                ) : null}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  {item.product.category}
                </p>
                <Link
                  href={`/products/${item.product.slug}`}
                  className="mt-1 block font-display text-lg font-semibold tracking-tight text-ink transition hover:text-ink-soft"
                >
                  {item.product.name}
                </Link>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {item.reason}
                </p>
                <RelatedProductPurchase
                  product={item.product}
                  availability={availability}
                />
                <Link
                  href={`/products/${item.product.slug}`}
                  className="mt-3 inline-block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-accent transition hover:text-ink"
                >
                  View details →
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-12 border-t border-line pt-8">
        <p className="label">Research documentation</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {RELATED_RESOURCE_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block text-sm font-semibold text-ink transition hover:text-ink-soft"
              >
                {link.label}
              </Link>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                {link.reason}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
