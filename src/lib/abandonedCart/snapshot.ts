import { getProductBySlug, getVariant, productDisplayName } from "@/data/products";
import { getSiteUrl } from "@/lib/seo/siteUrl";
import { SAVED_CART_CURRENCY } from "./constants";
import type { CartLineInput, SavedCartItem } from "./types";

function absoluteImageUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function snapshotCartItems(lines: CartLineInput[]): {
  items: SavedCartItem[];
  subtotal: number;
  droppedCount: number;
} {
  const items: SavedCartItem[] = [];
  let droppedCount = 0;
  for (const line of lines) {
    const qty = Math.floor(line.qty);
    if (!Number.isFinite(qty) || qty < 1) {
      droppedCount += 1;
      continue;
    }
    const product = getProductBySlug(line.slug);
    const variant = product ? getVariant(product, line.size) : undefined;
    if (!product || !variant) {
      droppedCount += 1;
      continue;
    }
    items.push({
      slug: product.slug,
      size: variant.size,
      sku: variant.sku,
      name: productDisplayName(product),
      quantity: qty,
      unitPrice: variant.price,
      imageUrl: absoluteImageUrl(variant.image),
    });
  }
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  return { items, subtotal, droppedCount };
}

export function cartCurrency(): string {
  return SAVED_CART_CURRENCY;
}
