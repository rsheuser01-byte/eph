import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createSupabaseOrderStore } from "../src/lib/orders/supabaseStore";
import { approvedOrderDefaults, type OrderRecord } from "../src/lib/orders/types";
import { createClient } from "@supabase/supabase-js";

/**
 * One-time import of local `.data/orders.json` into Supabase.
 *
 * Usage (from web/):
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/import-orders-json.ts
 */
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }

  const filePath =
    process.env.ORDER_STORE_FILE ?? join(process.cwd(), ".data", "orders.json");
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as OrderRecord[];
  if (!Array.isArray(parsed)) {
    throw new Error("orders.json is not an array");
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const store = createSupabaseOrderStore(client);

  let imported = 0;
  for (const record of parsed) {
    await store.save(
      approvedOrderDefaults({
        ...record,
        paymentStatus: record.paymentStatus ?? "approved",
        fulfillmentStatus: record.fulfillmentStatus ?? "unfulfilled",
        refundedAmount: record.refundedAmount ?? 0,
      }),
    );
    imported += 1;
  }

  console.log(`Imported ${imported} orders from ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
