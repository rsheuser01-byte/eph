import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { breadcrumbSchema } from "@/lib/seo/structuredData";

export const metadata: Metadata = pageMetadata({
  title: "Research Peptides, Blends & Lab Supplies",
  description:
    "Browse the Elevate Precision Health catalog of research-only peptides, blends, and laboratory supplies. Research use only — not for human or veterinary use.",
  path: "/products",
});

export default function ProductsPage() {
  return (
    <div className="site-shell py-20">
      <JsonLd
        data={breadcrumbSchema(getSiteUrl(), [
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
        ])}
      />
      <div className="max-w-2xl">
        <p className="label">Products</p>
        <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
          Browse the catalog
        </h1>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">
          Research use only. Ranges show available vial sizes where a SKU ships
          in more than one quantity.
        </p>
      </div>

      <h2 className="sr-only">All products</h2>
      <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
