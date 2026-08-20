import { getProductAssaySignals } from "@/data/coa";
import {
  formatPrice,
  productDisplayName,
  productPrimaryImage,
  type Product,
} from "@/data/products";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import type { Metadata } from "next";

const PACKSHOT_SIZE = 1024;

/** Category-aware title fragment without awkward repeats. */
export function productPageTitleKind(product: Product): string {
  switch (product.category) {
    case "Peptide":
      return "Research Peptide";
    case "Coenzyme":
      return "Research Cofactor";
    case "Blend":
      return "Research Blend";
    case "Supply":
      return "Lab Supply";
    default:
      return `Research ${product.category}`;
  }
}

/** Absolute document title for product detail pages. */
export function productPageTitle(product: Product): string {
  return `${productDisplayName(product)} ${productPageTitleKind(product)} | ${site.name}`;
}

/**
 * Unique SERP meta description: identity + research interest first, then
 * concise size/price and testing trust signals, then RUO framing.
 */
export function productMetaDescription(product: Product): string {
  const lead = product.shortDescription.trim().replace(/\s+/g, " ");
  const leadSentence = /[.!?]$/.test(lead) ? lead : `${lead}.`;

  const parts: string[] = [leadSentence];
  const price = formatPrice(product);
  const sizes = product.variants.map((variant) => variant.size);

  if (sizes.length > 1) {
    parts.push(`Available in ${sizes.join(", ")} (${price}).`);
  } else if (sizes[0]) {
    parts.push(`${sizes[0]} vial — ${price}.`);
  }

  const assay = getProductAssaySignals(product.slug);
  if (assay.purity) {
    const method = assay.testMethods ? ` via ${assay.testMethods}` : "";
    const coaNote = assay.hasPublishedCoa
      ? " Certificate of analysis on the product page."
      : "";
    parts.push(`Lot purity ${assay.purity}${method}.${coaNote}`);
  } else if (assay.hasPublishedCoa) {
    parts.push("Certificate of analysis available on the product page.");
  }

  parts.push("Research use only — not for human or veterinary use.");

  return parts
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+\./g, ".")
    .trim();
}

/** Metadata for `/products/[slug]` with unique description and packshot OG image. */
export function productPageMetadata(product: Product): Metadata {
  const imagePath = productPrimaryImage(product);
  const title = productPageTitle(product);
  const description = productMetaDescription(product);

  return pageMetadata({
    absoluteTitle: title,
    description,
    path: `/products/${product.slug}`,
    image: imagePath
      ? {
          url: imagePath,
          width: PACKSHOT_SIZE,
          height: PACKSHOT_SIZE,
          alt: `${productDisplayName(product)} research product`,
        }
      : undefined,
  });
}
