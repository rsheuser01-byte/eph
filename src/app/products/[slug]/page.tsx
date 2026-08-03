import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { InstitutionalCta } from "@/components/InstitutionalCta";
import { ProductPurchase } from "@/components/ProductPurchase";
import { ProductResearchContext } from "@/components/ProductResearchContext";
import { ProductSpecs } from "@/components/ProductSpecs";
import { RelatedProducts } from "@/components/RelatedProducts";
import { getProductBySlug, products } from "@/data/products";
import { getRelatedProducts } from "@/data/relatedProducts";
import { researchDisclaimer } from "@/data/site";
import { getAvailabilityMap } from "@/lib/inventory/availability";
import { productPageMetadata } from "@/lib/seo/productPageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import {
  breadcrumbSchema,
  productSchema,
} from "@/lib/seo/structuredData";

/**
 * ISR — matches homepage/`/products` edge caching (audit Phase 2 #3).
 * Keep this literal equal to PRODUCT_PAGE_REVALIDATE_SECONDS in
 * `@/lib/inventory/productPageCache` (Next requires a statically analyzable value).
 */
export const revalidate = 300;

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
  return productPageMetadata(product);
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = getRelatedProducts(product.slug);
  const availability = await getAvailabilityMap([
    ...product.variants.map((variant) => variant.sku),
    ...related.flatMap((item) =>
      item.product.variants.map((variant) => variant.sku),
    ),
  ]);

  return (
    <div className="site-shell py-20">
      <JsonLd
        data={[
          breadcrumbSchema(getSiteUrl(), [
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: product.name, path: `/products/${product.slug}` },
          ]),
          productSchema(getSiteUrl(), product, availability),
        ]}
      />
      <Link
        href="/products"
        className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-ink-soft transition hover:text-ink"
      >
        ← Products
      </Link>

      <ProductPurchase
        product={product}
        disclaimer={researchDisclaimer}
        availability={availability}
      />
      <ProductSpecs product={product} />
      <ProductResearchContext
        productSlug={product.slug}
        productName={product.name}
      />
      <RelatedProducts items={related} availability={availability} />
      <InstitutionalCta variant="compact" className="mt-16" />
    </div>
  );
}
