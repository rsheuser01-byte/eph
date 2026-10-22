import type { PromoCode } from "./types";

export type PromoWindowStatus = "active" | "scheduled" | "expired" | "cancelled";

function instant(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** How a code should read in admin, and whether checkout may apply it. */
export function promoWindowStatus(
  promo: PromoCode,
  now = Date.now(),
): PromoWindowStatus {
  if (!promo.active) {
    return "cancelled";
  }
  const start = instant(promo.startsAt);
  const end = instant(promo.endsAt);
  if (start !== null && now < start) {
    return "scheduled";
  }
  if (end !== null && now >= end) {
    return "expired";
  }
  return "active";
}

export async function promoEligibilityError(
  promo: PromoCode,
  email: string,
  hasApprovedOrderForEmail: (email: string) => Promise<boolean>,
  now = Date.now(),
): Promise<string | null> {
  const status = promoWindowStatus(promo, now);
  if (status === "cancelled") {
    return "This promo code is no longer active.";
  }
  if (status === "scheduled") {
    return "This promo code is not active yet.";
  }
  if (status === "expired") {
    return "This promo code has expired.";
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
