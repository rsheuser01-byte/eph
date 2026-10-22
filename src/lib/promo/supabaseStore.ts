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
  starts_at?: string | null;
  ends_at?: string | null;
};

const PROMO_COLUMNS =
  "code, percent_off, amount_off, active, first_order_only, label, starts_at, ends_at";
const LEGACY_COLUMNS =
  "code, percent_off, amount_off, active, first_order_only, label";

function missingWindowColumn(message: string): boolean {
  return /starts_at|ends_at/i.test(message);
}

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
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
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
      const first = await client
        .from("promo_codes")
        .select(PROMO_COLUMNS)
        .eq("code", normalized)
        .maybeSingle();
      const result = missingWindowColumn(first.error?.message ?? "")
        ? await client
            .from("promo_codes")
            .select(LEGACY_COLUMNS)
            .eq("code", normalized)
            .maybeSingle()
        : first;

      if (result.error) {
        throw new Error(`Failed to get promo code: ${result.error.message}`);
      }
      if (!result.data) {
        return null;
      }
      return mapRow(result.data as PromoRow);
    },

    async list(): Promise<PromoCode[]> {
      const first = await client
        .from("promo_codes")
        .select(PROMO_COLUMNS)
        .order("code", { ascending: true });
      const result = missingWindowColumn(first.error?.message ?? "")
        ? await client
            .from("promo_codes")
            .select(LEGACY_COLUMNS)
            .order("code", { ascending: true })
        : first;
      if (result.error) {
        throw new Error(`Failed to list promo codes: ${result.error.message}`);
      }
      return ((result.data ?? []) as PromoRow[]).map(mapRow);
    },

    async upsert(promo: PromoCode): Promise<void> {
      const code = normalizePromoCode(promo.code);
      const payload = {
        code,
        percent_off: promo.percentOff ?? null,
        amount_off: promo.amountOff ?? null,
        active: promo.active,
        first_order_only: promo.firstOrderOnly,
        label: promo.label,
        starts_at: promo.startsAt ?? null,
        ends_at: promo.endsAt ?? null,
      };
      const first = await client
        .from("promo_codes")
        .upsert(payload, { onConflict: "code" });
      if (!first.error) {
        return;
      }
      if (!missingWindowColumn(first.error.message)) {
        throw new Error(`Failed to upsert promo code: ${first.error.message}`);
      }
      if (promo.startsAt || promo.endsAt) {
        throw new Error(
          "Start and end times are not installed in the database yet. Run the promo window migration, then save again.",
        );
      }
      const retry = await client.from("promo_codes").upsert(
        {
          code: payload.code,
          percent_off: payload.percent_off,
          amount_off: payload.amount_off,
          active: payload.active,
          first_order_only: payload.first_order_only,
          label: payload.label,
        },
        { onConflict: "code" },
      );
      if (retry.error) {
        throw new Error(`Failed to upsert promo code: ${retry.error.message}`);
      }
    },
  };
}
