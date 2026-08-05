import type { PromoCode } from "./types";

export async function promoEligibilityError(
  promo: PromoCode,
  email: string,
  hasApprovedOrderForEmail: (email: string) => Promise<boolean>,
): Promise<string | null> {
  if (!promo.active) {
    return "This promo code is no longer active.";
  }

  if (!promo.firstOrderOnly) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return "Enter your email to apply this first-order promo code.";
  }

  if (await hasApprovedOrderForEmail(normalizedEmail)) {
    return "This promo code is only valid on your first order.";
  }

  return null;
}
