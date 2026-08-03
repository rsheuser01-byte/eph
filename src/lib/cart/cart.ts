import {
  getProductBySlug,
  getVariant,
  type Product,
} from "@/data/products";
import type { CartLine, ResolvedCartLine } from "./types";

export const MAX_QTY_PER_LINE = 99;

function sameLine(line: CartLine, slug: string, size: string): boolean {
  return line.slug === slug && line.size === size;
}

function clampQty(qty: number, maxQty = MAX_QTY_PER_LINE): number {
  const ceiling = Math.max(0, Math.min(MAX_QTY_PER_LINE, Math.floor(maxQty)));
  if (ceiling < 1) {
    return 0;
  }
  if (!Number.isFinite(qty)) {
    return 1;
  }
  const rounded = Math.floor(qty);
  if (rounded < 1) {
    return 1;
  }
  return Math.min(rounded, ceiling);
}

/**
 * Max units a shopper may hold for a SKU given live availability.
 * Missing key / null qty → inventory not configured → allow global max.
 */
export function purchasableMaxQty(
  sku: string,
  availability: Record<string, number | null> | null | undefined,
): number {
  if (!availability || !Object.prototype.hasOwnProperty.call(availability, sku)) {
    return MAX_QTY_PER_LINE;
  }
  const stock = availability[sku];
  if (stock === null || stock === undefined) {
    return MAX_QTY_PER_LINE;
  }
  return Math.max(0, Math.min(MAX_QTY_PER_LINE, Math.floor(stock)));
}

// All helpers return new arrays; the input is never mutated.
export function addLine(
  lines: CartLine[],
  slug: string,
  size: string,
  qty: number,
  maxQty = MAX_QTY_PER_LINE,
): CartLine[] {
  const safeQty = clampQty(qty, maxQty);
  if (safeQty < 1) {
    return lines;
  }
  const existing = lines.find((line) => sameLine(line, slug, size));
  if (!existing) {
    return [...lines, { slug, size, qty: safeQty }];
  }
  return lines.map((line) =>
    sameLine(line, slug, size)
      ? { ...line, qty: clampQty(line.qty + safeQty, maxQty) }
      : line,
  );
}

export function updateQty(
  lines: CartLine[],
  slug: string,
  size: string,
  qty: number,
  maxQty = MAX_QTY_PER_LINE,
): CartLine[] {
  if (qty < 1) {
    return removeLine(lines, slug, size);
  }
  const safeQty = clampQty(qty, maxQty);
  if (safeQty < 1) {
    return removeLine(lines, slug, size);
  }
  return lines.map((line) =>
    sameLine(line, slug, size) ? { ...line, qty: safeQty } : line,
  );
}

export function removeLine(
  lines: CartLine[],
  slug: string,
  size: string,
): CartLine[] {
  return lines.filter((line) => !sameLine(line, slug, size));
}

/** Cap each resolved line to live stock (removes lines when stock is 0). */
export function clampResolvedLinesToStock(
  lines: CartLine[],
  resolved: ResolvedCartLine[],
  availability: Record<string, number | null>,
): CartLine[] {
  let next = lines;
  for (const item of resolved) {
    const max = purchasableMaxQty(item.variant.sku, availability);
    if (item.line.qty > max) {
      next = updateQty(next, item.line.slug, item.line.size, max, max);
    }
  }
  return next;
}

export function resolveLines(lines: CartLine[]): ResolvedCartLine[] {
  const resolved: ResolvedCartLine[] = [];
  for (const line of lines) {
    const product: Product | undefined = getProductBySlug(line.slug);
    if (!product) {
      continue;
    }
    const variant = getVariant(product, line.size);
    if (!variant) {
      continue;
    }
    resolved.push({
      line,
      product,
      variant,
      lineTotal: variant.price * line.qty,
    });
  }
  return resolved;
}

export function cartSubtotal(lines: CartLine[]): number {
  return resolveLines(lines).reduce((sum, item) => sum + item.lineTotal, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.qty, 0);
}
