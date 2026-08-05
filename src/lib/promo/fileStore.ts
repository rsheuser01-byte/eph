import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { normalizePromoCode } from "./applyPromo";
import type { PromoCode, PromoStore } from "./types";

function defaultPath(): string {
  return (
    process.env.PROMO_STORE_FILE ??
    join(process.cwd(), ".data", "promo-codes.json")
  );
}

function normalize(promo: PromoCode): PromoCode {
  return {
    ...promo,
    code: normalizePromoCode(promo.code),
    active: promo.active !== false,
    firstOrderOnly: Boolean(promo.firstOrderOnly),
    label: promo.label?.trim() || promo.code,
  };
}

async function readAll(filePath: string): Promise<PromoCode[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return (parsed as PromoCode[]).map(normalize);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeAll(filePath: string, promos: PromoCode[]): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(promos, null, 2), "utf8");
}

export function createFilePromoStore(filePath = defaultPath()): PromoStore {
  return {
    name: "file",
    async getByCode(code: string): Promise<PromoCode | null> {
      const normalized = normalizePromoCode(code);
      if (!normalized) {
        return null;
      }
      const promos = await readAll(filePath);
      return promos.find((promo) => promo.code === normalized) ?? null;
    },
    async upsert(promo: PromoCode): Promise<void> {
      const next = normalize(promo);
      const promos = await readAll(filePath);
      const index = promos.findIndex((row) => row.code === next.code);
      if (index >= 0) {
        promos[index] = next;
      } else {
        promos.push(next);
      }
      await writeAll(filePath, promos);
    },
  };
}
