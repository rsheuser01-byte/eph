import { computeDiscount, normalizePromoCode } from "./applyPromo";
import { promoEligibilityError } from "./eligibility";
import type { PromoCode, PromoStore } from "./types";

export type ResolvePromoInput = {
  promoCode: string;
  email?: string;
  subtotal: number;
  promoStore: PromoStore;
  hasApprovedOrderForEmail: (email: string) => Promise<boolean>;
};

export type ResolvePromoResult =
  | {
      ok: true;
      promo: PromoCode;
      discount: number;
    }
  | { ok: false; error: string };

export async function resolvePromo(
  input: ResolvePromoInput,
): Promise<ResolvePromoResult> {
  const code = normalizePromoCode(input.promoCode);
  if (!code) {
    return { ok: false, error: "Enter a promo code." };
  }

  const promo = await input.promoStore.getByCode(code);
  if (!promo) {
    return { ok: false, error: "Invalid promo code." };
  }

  const eligibilityError = await promoEligibilityError(
    promo,
    input.email ?? "",
    input.hasApprovedOrderForEmail,
  );
  if (eligibilityError) {
    return { ok: false, error: eligibilityError };
  }

  const discount = computeDiscount(promo, input.subtotal);
  if (discount <= 0) {
    return { ok: false, error: "This promo code does not apply to your cart." };
  }

  return { ok: true, promo, discount };
}
