import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { getProductBySlug, products } from "@/data/products";
import { researchDisclaimer } from "@/data/site";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found" };
  }
  return {
    title: product.name,
    description: product.shortDescription,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="site-shell py-20">
      <Link
        href="/products"
        className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ink-soft transition hover:text-ink"
      >
        ← Products
      </Link>

      <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_1fr]">
        <div>
          <p className="label">{product.category}</p>
          <h1 className="font-display mt-4 text-5xl font-semibold tracking-tight text-ink sm:text-7xl">
            {product.name}
          </h1>
          <p className="mt-5 text-xs uppercase tracking-[0.18em] text-ink-soft">
            SKU {product.sku}
          </p>
          <p className="mt-8 text-base leading-relaxed text-ink-soft">
            {product.shortDescription}
          </p>
        </div>

        <div className="border-t border-line pt-10 lg:border-t-0 lg:border-l lg:pl-14 lg:pt-0">
          <AddToCart product={product} />

          <div className="mt-8">
            <Link
              href="/coa"
              className="link-underline text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft"
            >
              Assay policy →
            </Link>
          </div>

          <p className="mt-12 text-[0.7rem] leading-relaxed text-ink-soft/80">
            {researchDisclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
