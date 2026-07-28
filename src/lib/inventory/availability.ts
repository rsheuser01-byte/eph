import { products } from "@/data/products";
import {
  adjustStock,
  getStockBySku,
  isInventoryEnabled,
  listInventory,
  seedInventoryFromCatalog,
} from "@/lib/inventory";

/**
 * Pure helpers used by product pages / add-to-cart for availability display.
 * When inventory is disabled (no Supabase), treat all SKUs as available.
 */
export async function getAvailabilityMap(
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
  const bySku = new Map(rows.map((row) => [row.sku, row.quantityOnHand]));
  for (const sku of skus) {
    result[sku] = bySku.get(sku) ?? 0;
  }
  return result;
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
