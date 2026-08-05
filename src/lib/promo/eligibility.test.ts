import { describe, expect, it, vi } from "vitest";
import { promoEligibilityError } from "./eligibility";
import type { PromoCode } from "./types";

const firstOrder: PromoCode = {
  code: "FIRST20",
  percentOff: 20,
  active: true,
  firstOrderOnly: true,
  label: "20% off first order",
};

const openPromo: PromoCode = {
  code: "OPEN10",
  amountOff: 10,
  active: true,
  firstOrderOnly: false,
  label: "$10 off",
};

describe("promoEligibilityError", () => {
  it("rejects inactive codes", async () => {
    const error = await promoEligibilityError(
      { ...openPromo, active: false },
      "a@b.com",
      async () => false,
    );
    expect(error).toMatch(/no longer active/i);
  });

  it("requires email for first-order codes", async () => {
    const error = await promoEligibilityError(firstOrder, "", async () => false);
    expect(error).toMatch(/email/i);
  });

  it("rejects first-order codes when email already has an approved order", async () => {
    const hasApproved = vi.fn(async () => true);
    const error = await promoEligibilityError(
      firstOrder,
      "ada@example.com",
      hasApproved,
    );
    expect(error).toMatch(/first order/i);
    expect(hasApproved).toHaveBeenCalledWith("ada@example.com");
  });

  it("allows first-order codes for new emails", async () => {
    const error = await promoEligibilityError(
      firstOrder,
      "new@example.com",
      async () => false,
    );
    expect(error).toBeNull();
  });

  it("allows open promos without email", async () => {
    const error = await promoEligibilityError(openPromo, "", async () => true);
    expect(error).toBeNull();
  });
});
