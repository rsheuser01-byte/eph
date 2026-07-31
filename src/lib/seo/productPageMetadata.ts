import { getProductAssaySignals } from "@/data/coa";
import {
  formatPrice,
  productPrimaryImage,
  type Product,
} from "@/data/products";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import type { Metadata } from "next";

const PACKSHOT_SIZE = 1024;

/**
 * Unique SERP meta description built from catalog + certificate-backed assay
 * data — not the old name/SKU/category mail-merge template.
 */
export function productMetaDescription(product: Product): string {
  const parts: string[] = [product.shortDescription.trim()];
  const price = formatPrice(product);
  const sizes = product.variants.map((variant) => variant.size);

  if (sizes.length > 1) {
    parts.push(`Available in ${sizes.join(", ")} (${price}).`);
  } else if (sizes[0]) {
    parts.push(`${sizes[0]} — ${price}.`);
  }

  const assay = getProductAssaySignals(product.slug);
  if (assay.purity) {
    const method = assay.testMethods ? ` via ${assay.testMethods}` : "";
    const coa = assay.hasPublishedCoa
      ? "; certificate on the product page"
      : "";
    parts.push(`Lot purity ${assay.purity}${method}${coa}.`);
  } else if (assay.hasPublishedCoa) {
    parts.push("Certificate of analysis available on the product page.");
  }

  parts.push("Research use only — not for human or veterinary use.");
  return parts.join(" ");
}

/** Metadata for `/products/[slug]` with unique description and packshot OG image. */
export function productPageMetadata(product: Product): Metadata {
  const imagePath = productPrimaryImage(product);
  const title = `${product.name} — Research ${product.category}`;
  const description = productMetaDescription(product);

  return pageMetadata({
    title,
    description,
    path: `/products/${product.slug}`,
    image: imagePath
      ? {
          url: imagePath,
          width: PACKSHOT_SIZE,
          height: PACKSHOT_SIZE,
          alt: `${product.name} research product`,
        }
      : undefined,
  });
}
