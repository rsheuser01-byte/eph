import type { Product } from "@/data/products";

export type ProductSpecSection = {
  id: string;
  question: string;
  answer: string;
};

/**
 * Question-based openers for the product specs block (Phase 3 #8).
 * Answers are built from existing catalog fields — no therapeutic claims.
 */
export function buildProductSpecSections(
  product: Product,
): ProductSpecSection[] {
  const alias = primaryAlias(product);
  const identityName = alias ? `${product.name} (${alias})` : product.name;

  return [
    {
      id: "product-specs",
      question: `What is ${identityName}?`,
      answer: identityAnswer(product),
    },
    {
      id: "product-specs-supply",
      question: `How is ${product.name} supplied and stored?`,
      answer: supplyAnswer(product),
    },
    {
      id: "product-specs-attributes",
      question: `What laboratory reference attributes are listed for ${product.name}?`,
      answer: attributesAnswer(product),
    },
  ];
}

function primaryAlias(product: Product): string | null {
  const synonyms = product.specs.synonyms?.trim();
  if (!synonyms) {
    return null;
  }
  const first = synonyms.split(",")[0]?.trim();
  return first && first.toLowerCase() !== product.name.toLowerCase()
    ? first
    : null;
}

function identityAnswer(product: Product): string {
  const { specs } = product;
  const application = trimSentence(specs.researchApplication);
  const lead = trimSentence(product.shortDescription);

  if (specs.composition) {
    return `${lead} Composition listed for laboratory reference: ${specs.composition}. Typical research application: ${application} Research use only — not for human or veterinary use.`;
  }

  return `${lead} In laboratory settings it is referenced for ${decapitalize(application)} Research use only — not for human or veterinary use.`;
}

function supplyAnswer(product: Product): string {
  const { specs } = product;
  const form = specs.form.replace(/\.$/, "");
  const appearance = specs.appearance.replace(/\.$/, "");
  const storage = trimSentence(specs.storage);

  return `${product.name} is supplied as ${decapitalize(form)} (${decapitalize(appearance)}). ${storage}`;
}

function attributesAnswer(product: Product): string {
  const bits: string[] = ["form", "research application", "appearance", "storage"];
  if (product.specs.composition) bits.push("composition");
  if (product.specs.molecularFormula) bits.push("molecular formula");
  if (product.specs.molecularWeight) bits.push("molecular weight");
  if (product.specs.sequence) bits.push("sequence");
  if (product.specs.synonyms) bits.push("aliases");

  const listed = bits.slice(0, -1).join(", ") + ", and " + bits[bits.length - 1];
  return `The table below lists ${listed} for ${product.name} as laboratory reference data for qualified research protocols.`;
}

function trimSentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function decapitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toLowerCase() + value.slice(1);
}
