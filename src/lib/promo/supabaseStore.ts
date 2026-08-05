import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePromoCode } from "./applyPromo";
import type { PromoCode, PromoStore } from "./types";

type PromoRow = {
  code: string;
  percent_off: number | string | null;
  amount_off: number | string | null;
  active: boolean;
  first_order_only: boolean;
  label: string;
};

function asNumber(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function mapRow(row: PromoRow): PromoCode {
  return {
    code: normalizePromoCode(row.code),
    percentOff: asNumber(row.percent_off),
    amountOff: asNumber(row.amount_off),
    active: row.active,
    firstOrderOnly: row.first_order_only,
    label: row.label,
  };
}

export function createSupabasePromoStore(client: SupabaseClient): PromoStore {
  return {
    name: "supabase",

    async getByCode(code: string): Promise<PromoCode | null> {
      const normalized = normalizePromoCode(code);
      if (!normalized) {
        return null;
      }
      const { data, error } = await client
        .from("promo_codes")
        .select(
          "code, percent_off, amount_off, active, first_order_only, label",
        )
        .eq("code", normalized)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to get promo code: ${error.message}`);
      }
      if (!data) {
        return null;
      }
      return mapRow(data as PromoRow);
    },

    async upsert(promo: PromoCode): Promise<void> {
      const code = normalizePromoCode(promo.code);
      const { error } = await client.from("promo_codes").upsert(
        {
          code,
          percent_off: promo.percentOff ?? null,
          amount_off: promo.amountOff ?? null,
          active: promo.active,
          first_order_only: promo.firstOrderOnly,
          label: promo.label,
        },
        { onConflict: "code" },
      );
      if (error) {
        throw new Error(`Failed to upsert promo code: ${error.message}`);
      }
    },
  };
}
