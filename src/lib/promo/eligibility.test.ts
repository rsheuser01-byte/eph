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

  it("rejects a code before its start time", async () => {
    const error = await promoEligibilityError(
      { ...openPromo, startsAt: "2026-12-01T00:00:00.000Z" },
      "",
      async () => false,
      Date.parse("2026-11-01T00:00:00.000Z"),
    );
    expect(error).toMatch(/not active yet/i);
  });

  it("rejects a code after its end time", async () => {
    const error = await promoEligibilityError(
      { ...openPromo, endsAt: "2026-10-01T00:00:00.000Z" },
      "",
      async () => false,
      Date.parse("2026-10-02T00:00:00.000Z"),
    );
    expect(error).toMatch(/expired/i);
  });

  it("allows a code inside its window", async () => {
    const error = await promoEligibilityError(
      {
        ...openPromo,
        startsAt: "2026-10-01T00:00:00.000Z",
        endsAt: "2026-10-31T00:00:00.000Z",
      },
      "",
      async () => false,
      Date.parse("2026-10-15T00:00:00.000Z"),
    );
    expect(error).toBeNull();
  });
});
