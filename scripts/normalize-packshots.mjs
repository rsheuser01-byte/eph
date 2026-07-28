import path from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";
import { normalizePackshotDir } from "./lib/packshotFrame.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsDir = path.join(__dirname, "..", "public", "products");

/**
 * Files produced by derive:packshots (dosage re-stamped from packshot-masters).
 * Never re-normalize these independently — that can shift bottles / text.
 * Single-SKU photos (glow, klow, etc.) are still normalized.
 */
const DERIVED_PACKSHOTS = new Set([
  "glp-3-10mg.png",
  "glp-3-15mg.png",
  "glp-3-30mg.png",
  "glp-3-60mg.png",
  "glp-2-10mg.png",
  "glp-2-20mg.png",
  "glp-2-30mg.png",
  "mots-c-10mg.png",
  "mots-c-20mg.png",
  "tesamorelin-5mg.png",
  "tesamorelin-10mg.png",
  "nad-100mg.png",
  "nad-500mg.png",
  "nad-1000mg.png",
  "bac-10ml.png",
  "bac-30ml.png",
]);

const allPngs = (await readdir(productsDir)).filter((f) =>
  f.toLowerCase().endsWith(".png"),
);
const masters = allPngs.filter((f) => !DERIVED_PACKSHOTS.has(f));

const results = await normalizePackshotDir(productsDir, { onlyFiles: masters });

for (const { file, before, after } of results) {
  const bH = (before.heightRatio * 100).toFixed(1);
  const aH = (after.heightRatio * 100).toFixed(1);
  console.log(
    `${file}: ${before.canvasWidth}x${before.canvasHeight} @${bH}%h → ${after.canvasWidth}x${after.canvasHeight} @${aH}%h`,
  );
}

console.log(
  `\nNormalized ${results.length} packshots in ${productsDir} (skipped ${DERIVED_PACKSHOTS.size} derived sizes)`,
);
