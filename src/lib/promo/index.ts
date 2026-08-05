import { createFilePromoStore } from "./fileStore";
import { createSupabasePromoStore } from "./supabaseStore";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { PromoStore } from "./types";

export function getPromoStore(): PromoStore {
  const store = (
    process.env.PROMO_STORE ??
    process.env.ORDER_STORE ??
    "file"
  ).toLowerCase();
  switch (store) {
    case "file":
      return createFilePromoStore();
    case "supabase":
      return createSupabasePromoStore(getSupabaseAdmin());
    default:
      throw new Error(`Unknown PROMO_STORE: ${store}`);
  }
}

export type { PromoCode, PromoStore } from "./types";
export { resolvePromo } from "./resolvePromo";
export {
  computeDiscount,
  normalizePromoCode,
  proportionallyDiscountedUnitPrices,
} from "./applyPromo";
