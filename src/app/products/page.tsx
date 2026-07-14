import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Research peptides, blends, and laboratory supplies from Elevate Precision Health.",
};

export default function ProductsPage() {
  return (
    <div className="site-shell py-20">
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

      <div className="mt-14 border-t border-ink/20">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
