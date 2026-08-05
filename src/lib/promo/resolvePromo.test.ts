import { describe, expect, it } from "vitest";
import { resolvePromo } from "./resolvePromo";
import type { PromoCode, PromoStore } from "./types";

function memoryStore(promos: PromoCode[]): PromoStore {
  const byCode = new Map(promos.map((p) => [p.code, p]));
  return {
    name: "memory",
    async getByCode(code) {
      return byCode.get(code.trim().toUpperCase()) ?? null;
    },
  };
}

const save20: PromoCode = {
  code: "SAVE20",
  percentOff: 20,
  active: true,
  firstOrderOnly: false,
  label: "20% off",
};

describe("resolvePromo", () => {
  it("returns discount for a valid code", async () => {
    const result = await resolvePromo({
      promoCode: "save20",
      subtotal: 100,
      promoStore: memoryStore([save20]),
      hasApprovedOrderForEmail: async () => false,
    });
    expect(result).toEqual({
      ok: true,
      promo: save20,
      discount: 20,
    });
  });

  it("rejects unknown codes", async () => {
    const result = await resolvePromo({
      promoCode: "NOPE",
      subtotal: 100,
      promoStore: memoryStore([]),
      hasApprovedOrderForEmail: async () => false,
    });
    expect(result).toEqual({ ok: false, error: "Invalid promo code." });
  });
});
