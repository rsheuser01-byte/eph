import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import sharp from "sharp";
import {
  derivePackshotFromMaster,
  formatDosageLabel,
} from "../../scripts/lib/packshotFromMaster.mjs";
import { products } from "./products";

const productsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../public/products",
);

describe("formatDosageLabel", () => {
  it("inserts a space before mg/ml", () => {
    expect(formatDosageLabel("15mg")).toBe("15 mg");
    expect(formatDosageLabel("500mg")).toBe("500 mg");
    expect(formatDosageLabel("10ml")).toBe("10 ml");
  });
});

describe("derivePackshotFromMaster", () => {
  it("keeps the master vial pixels identical outside the dosage patch", async () => {
    const master = path.join(productsDir, "glp-3-15mg.png");
    const dir = await mkdtemp(path.join(tmpdir(), "packshot-"));
    const out = path.join(dir, "glp-3-30mg.png");

    try {
      const derived = await derivePackshotFromMaster(master, "30mg", out);
      const masterRaw = await sharp(master)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const outRaw = await sharp(out)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      expect(outRaw.info.width).toBe(masterRaw.info.width);
      expect(outRaw.info.height).toBe(masterRaw.info.height);

      const { patchLeft, patchTop, patchWidth, patchHeight } = derived;
      const w = masterRaw.info.width;
      const ch = masterRaw.info.channels;
      let outsideDiffs = 0;

      for (let y = 0; y < masterRaw.info.height; y++) {
        for (let x = 0; x < w; x++) {
          const inPatch =
            x >= patchLeft &&
            x < patchLeft + patchWidth &&
            y >= patchTop &&
            y < patchTop + patchHeight;
          if (inPatch) continue;
          const i = (y * w + x) * ch;
          if (
            masterRaw.data[i] !== outRaw.data[i] ||
            masterRaw.data[i + 1] !== outRaw.data[i + 1] ||
            masterRaw.data[i + 2] !== outRaw.data[i + 2]
          ) {
            outsideDiffs++;
          }
        }
      }

      expect(outsideDiffs).toBe(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("can derive every non-first multi-size packshot from that product master", async () => {
    const multi = products.filter((product) => product.variants.length > 1);
    expect(multi.length).toBeGreaterThan(0);

    for (const product of multi) {
      const masterPath = path.join(
        productsDir,
        path.basename(product.variants[0]!.image),
      );
      const dir = await mkdtemp(path.join(tmpdir(), "packshot-"));
      try {
        for (const variant of product.variants.slice(1)) {
          const out = path.join(dir, path.basename(variant.image));
          await expect(
            derivePackshotFromMaster(masterPath, variant.size, out),
          ).resolves.toMatchObject({
            label: formatDosageLabel(variant.size),
          });
        }
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    }
  });
});
