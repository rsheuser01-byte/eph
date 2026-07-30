import { getProductBySlug } from "@/data/products";

export type StockNotifyRequest = {
  email: string;
  productSlug: string;
  sku: string;
  size: string;
};

export type ParseStockNotifyResult =
  | { ok: true; value: StockNotifyRequest }
  | { ok: false; error: string };

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  // Practical check (not RFC-complete): local@domain with a dot in the domain.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates a restock-notify payload against the live catalog so callers
 * cannot invent SKUs or sizes that are not sold.
 */
export function parseStockNotifyRequest(
  input: unknown,
): ParseStockNotifyResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const record = input as Record<string, unknown>;
  const email = str(record.email).toLowerCase();
  const productSlug = str(record.productSlug);
  const sku = str(record.sku);
  const size = str(record.size);

  if (!email || !isValidEmail(email)) {
    return { ok: false, error: "A valid email address is required." };
  }
  if (!productSlug || !sku || !size) {
    return { ok: false, error: "Product, SKU, and size are required." };
  }

  const product = getProductBySlug(productSlug);
  if (!product) {
    return { ok: false, error: "Unknown product." };
  }

  const variant = product.variants.find((item) => item.sku === sku);
  if (!variant) {
    return { ok: false, error: "Unknown SKU for this product." };
  }
  if (variant.size !== size) {
    return { ok: false, error: "Size does not match the selected SKU." };
  }

  return {
    ok: true,
    value: { email, productSlug, sku, size },
  };
}
