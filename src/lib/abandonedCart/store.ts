import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createFileSavedCartStore } from "./fileStore";
import { createSupabaseSavedCartStore } from "./supabaseStore";
import type { SavedCartStore } from "./types";

export function getSavedCartStore(): SavedCartStore {
  const store = (process.env.ORDER_STORE ?? "file").toLowerCase();
  switch (store) {
    case "file":
      return createFileSavedCartStore();
    case "supabase":
      return createSupabaseSavedCartStore(getSupabaseAdmin());
    default:
      throw new Error(`Unknown ORDER_STORE: ${store}`);
  }
}
