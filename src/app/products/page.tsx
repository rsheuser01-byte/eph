import type { Metadata } from "next";
import { InstitutionalCta } from "@/components/InstitutionalCta";
import { JsonLd } from "@/components/JsonLd";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";
import { getAvailabilityMap } from "@/lib/inventory/availability";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import {
  breadcrumbSchema,
  catalogItemListSchema,
} from "@/lib/seo/structuredData";

export const metadata: Metadata = pageMetadata({
  title: "Research Peptides, Blends & Lab Supplies",
  description:
    "Browse the Elevate Precision Health catalog of research-only peptides, blends, and laboratory supplies. Research use only — not for human or veterinary use.",
  path: "/products",
});

export default async function ProductsPage() {
  const siteUrl = getSiteUrl();
  const availability = await getAvailabilityMap(
    products.flatMap((product) =>
      product.variants.map((variant) => variant.sku),
    ),
  );

  return (
    <div className="site-shell py-20">
      <JsonLd
        data={[
          breadcrumbSchema(siteUrl, [
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
          ]),
          catalogItemListSchema(siteUrl, products),
        ]}
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
        {products.map((product, index) => (
          <ProductCard
            key={product.slug}
            product={product}
            priority={index === 0}
            availability={availability}
          />
        ))}
      </div>

      <InstitutionalCta variant="compact" className="mt-20" />
    </div>
  );
}
