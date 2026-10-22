import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { computeDiscount } from "./applyPromo";
import { resolvePromo } from "./resolvePromo";
import type { PromoCode, PromoStore } from "./types";

const MIGRATION = path.join(
  process.cwd(),
  "supabase/migrations/20261022150000_elevate25_promo.sql",
);

const elevate25: PromoCode = {
  code: "ELEVATE25",
  percentOff: 25,
  active: true,
  firstOrderOnly: false,
  label: "25% off",
};

function memoryStore(promos: PromoCode[]): PromoStore {
  const byCode = new Map(promos.map((promo) => [promo.code, promo]));
  return {
    name: "memory",
    async getByCode(code) {
      return byCode.get(code.trim().toUpperCase()) ?? null;
    },
    async list() {
      return [...byCode.values()];
    },
    async upsert() {},
  };
}

describe("ELEVATE25", () => {
  it("is seeded as an active 25% code that anyone can use", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    expect(sql).toMatch(/'ELEVATE25'/);
    expect(sql).toMatch(/25/);
    expect(sql).toMatch(/'25% off'/);
    expect(sql).toMatch(/true,\s*false/);
  });

  it("takes 25% off merchandise and accepts lowercase entry", async () => {
    expect(computeDiscount(elevate25, 100)).toBe(25);
    expect(computeDiscount(elevate25, 79.99)).toBe(20);

    const result = await resolvePromo({
      promoCode: "elevate25",
      subtotal: 80,
      promoStore: memoryStore([elevate25]),
      hasApprovedOrderForEmail: async () => false,
    });

    expect(result).toEqual({
      ok: true,
      promo: elevate25,
      discount: 20,
    });
  });
});
