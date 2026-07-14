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

function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) {
    return 1;
  }
  const rounded = Math.floor(qty);
  if (rounded < 1) {
    return 1;
  }
  return Math.min(rounded, MAX_QTY_PER_LINE);
}

// All helpers return new arrays; the input is never mutated.
export function addLine(
  lines: CartLine[],
  slug: string,
  size: string,
  qty: number,
): CartLine[] {
  const safeQty = clampQty(qty);
  const existing = lines.find((line) => sameLine(line, slug, size));
  if (!existing) {
    return [...lines, { slug, size, qty: safeQty }];
  }
  return lines.map((line) =>
    sameLine(line, slug, size)
      ? { ...line, qty: clampQty(line.qty + safeQty) }
      : line,
  );
}

export function updateQty(
  lines: CartLine[],
  slug: string,
  size: string,
  qty: number,
): CartLine[] {
  if (qty < 1) {
    return removeLine(lines, slug, size);
  }
  return lines.map((line) =>
    sameLine(line, slug, size) ? { ...line, qty: clampQty(qty) } : line,
  );
}

export function removeLine(
  lines: CartLine[],
  slug: string,
  size: string,
): CartLine[] {
  return lines.filter((line) => !sameLine(line, slug, size));
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
