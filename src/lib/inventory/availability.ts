import { unstable_cache } from "next/cache";
import { products } from "@/data/products";
import {
  adjustStock,
  getStockBySku,
  isInventoryEnabled,
  listInventory,
  seedInventoryFromCatalog,
} from "@/lib/inventory";
import { PRODUCT_PAGE_REVALIDATE_SECONDS } from "@/lib/inventory/productPageCache";

/**
 * Load availability for product pages / add-to-cart display.
 * When inventory is disabled (no Supabase), treat all SKUs as available (null).
 */
export async function getLiveAvailabilityMap(
  skus: string[],
): Promise<Record<string, number | null>> {
  const result: Record<string, number | null> = {};
  if (!isInventoryEnabled()) {
    for (const sku of skus) {
      result[sku] = null;
    }
    return result;
  }

  const rows = await listInventory();
  const bySku = new Map(rows.map((row) => [row.sku, row.quantityAvailable]));
  for (const sku of skus) {
    result[sku] = bySku.get(sku) ?? 0;
  }
  return result;
}

/**
 * Cached for the product-page ISR window so Supabase reads do not force
 * `dynamic = "force-dynamic"` / no-store on `/products/[slug]`.
 */
const getCachedAvailabilityMap = unstable_cache(
  async (skus: string[]) => getLiveAvailabilityMap(skus),
  ["product-availability"],
  { revalidate: PRODUCT_PAGE_REVALIDATE_SECONDS },
);

export async function getAvailabilityMap(
  skus: string[],
): Promise<Record<string, number | null>> {
  const sorted = [...skus].sort();
  return getCachedAvailabilityMap(sorted);
}

export function productVariantSkus(slug: string): string[] {
  const product = products.find((item) => item.slug === slug);
  return product?.variants.map((variant) => variant.sku) ?? [];
}

export {
  adjustStock,
  getStockBySku,
  isInventoryEnabled,
  listInventory,
  seedInventoryFromCatalog,
};
