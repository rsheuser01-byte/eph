import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ProductPurchase } from "@/components/ProductPurchase";
import { ProductSpecs } from "@/components/ProductSpecs";
import { getProductBySlug, products } from "@/data/products";
import { researchDisclaimer } from "@/data/site";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { breadcrumbSchema } from "@/lib/seo/structuredData";

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
    return { title: "Product not found", robots: { index: false } };
  }
  return pageMetadata({
    title: `${product.name} — Research ${product.category}`,
    description: `${product.name} (${product.sku}), a research-use-only ${product.category.toLowerCase()} from Elevate Precision Health. Not for human or veterinary use.`,
    path: `/products/${product.slug}`,
  });
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="site-shell py-20">
      <JsonLd
        data={breadcrumbSchema(getSiteUrl(), [
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
          { name: product.name, path: `/products/${product.slug}` },
        ])}
      />
      <Link
        href="/products"
        className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ink-soft transition hover:text-ink"
      >
        ← Products
      </Link>

      <ProductPurchase product={product} disclaimer={researchDisclaimer} />
      <ProductSpecs product={product} />
    </div>
  );
}
