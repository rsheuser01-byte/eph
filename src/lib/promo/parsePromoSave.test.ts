import { describe, expect, it } from "vitest";
import { parsePromoActiveChange, parsePromoSave } from "./parsePromoSave";

describe("parsePromoSave", () => {
  it("normalizes a percent code and builds a label", () => {
    const result = parsePromoSave({
      code: " elevate25 ",
      percentOff: 25,
      firstOrderOnly: false,
    });
    expect(result).toEqual({
      ok: true,
      promo: {
        code: "ELEVATE25",
        percentOff: 25,
        amountOff: undefined,
        active: true,
        firstOrderOnly: false,
        label: "25% off",
        startsAt: undefined,
        endsAt: undefined,
      },
    });
  });

  it("rejects an end time that is not after the start", () => {
    const result = parsePromoSave({
      code: "FALL25",
      percentOff: 25,
      startsAt: "2026-11-02T00:00:00.000Z",
      endsAt: "2026-11-01T00:00:00.000Z",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects using both a percent and a dollar amount", () => {
    const result = parsePromoSave({
      code: "BOTH",
      percentOff: 10,
      amountOff: 5,
    });
    expect(result.ok).toBe(false);
  });
});

describe("parsePromoActiveChange", () => {
  it("accepts a cancel flag", () => {
    expect(parsePromoActiveChange({ code: "elevate25", active: false })).toEqual({
      ok: true,
      code: "ELEVATE25",
      active: false,
    });
  });
});
