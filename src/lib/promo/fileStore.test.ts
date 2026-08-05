import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createFilePromoStore } from "./fileStore";

let dir: string;
let filePath: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "promos-"));
  filePath = join(dir, "promo-codes.json");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("createFilePromoStore", () => {
  it("starts empty with no seed data", async () => {
    const store = createFilePromoStore(filePath);
    expect(await store.getByCode("WELCOME20")).toBeNull();
  });

  it("looks up codes case-insensitively after upsert", async () => {
    const store = createFilePromoStore(filePath);
    await store.upsert?.({
      code: "save20",
      percentOff: 20,
      active: true,
      firstOrderOnly: false,
      label: "20% off",
    });
    const found = await store.getByCode("Save20");
    expect(found?.code).toBe("SAVE20");
    expect(found?.percentOff).toBe(20);
  });
});
