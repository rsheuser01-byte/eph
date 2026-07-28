import { createFileOrderStore } from "./fileStore";
import { createSupabaseOrderStore } from "./supabaseStore";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { OrderStore } from "./types";

export function getOrderStore(): OrderStore {
  const store = (process.env.ORDER_STORE ?? "file").toLowerCase();
  switch (store) {
    case "file":
      return createFileOrderStore();
    case "supabase":
      return createSupabaseOrderStore(getSupabaseAdmin());
    default:
      throw new Error(`Unknown ORDER_STORE: ${store}`);
  }
}

export type {
  FulfillmentStatus,
  OrderRecord,
  OrderStatusUpdate,
  OrderStore,
  PaymentStatus,
} from "./types";
export { approvedOrderDefaults } from "./types";
