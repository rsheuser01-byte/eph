import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  calibrateDosageFontSize,
  derivePackshotFromMaster,
  findDosageRegion,
} from "./lib/packshotFromMaster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsDir = path.join(__dirname, "..", "public", "products");
const mastersDir = path.join(__dirname, "..", "packshot-masters");

/**
 * Photographic masters live in /packshot-masters. Every catalog vial —
 * including MT-2 — is stamped with one SVG dosage font so "10 mg" is the
 * same letters everywhere. PT-141 / SS-31 names are reapplied afterward
 * via `enlarge-vial-names.mjs`.
 */
const TARGET_DOSAGE_INK_HEIGHT = 32;

const jobs = [
  {
    dir: mastersDir,
    master: "glp-3-15mg.png",
    variants: [
      { file: "glp-3-10mg.png", size: "10mg" },
      { file: "glp-3-15mg.png", size: "15mg" },
      { file: "glp-3-30mg.png", size: "30mg" },
      { file: "glp-3-60mg.png", size: "60mg" },
    ],
  },
  {
    dir: mastersDir,
    master: "glp-2-10mg.png",
    variants: [
      { file: "glp-2-10mg.png", size: "10mg" },
      { file: "glp-2-20mg.png", size: "20mg" },
      { file: "glp-2-30mg.png", size: "30mg" },
    ],
  },
  {
    dir: mastersDir,
    master: "mots-c-10mg.png",
    variants: [
      { file: "mots-c-10mg.png", size: "10mg" },
      { file: "mots-c-20mg.png", size: "20mg" },
    ],
  },
  {
    dir: mastersDir,
    master: "tesamorelin-5mg.png",
    variants: [
      { file: "tesamorelin-5mg.png", size: "5mg" },
      { file: "tesamorelin-10mg.png", size: "10mg" },
    ],
  },
  {
    dir: mastersDir,
    master: "nad-100mg.png",
    variants: [
      { file: "nad-100mg.png", size: "100mg" },
      { file: "nad-500mg.png", size: "500mg" },
      { file: "nad-1000mg.png", size: "1000mg" },
    ],
  },
  {
    dir: productsDir,
    master: "mt-2-10mg.png",
    variants: [{ file: "mt-2-10mg.png", size: "10mg" }],
  },
  {
    dir: productsDir,
    master: "wolverine-blend-20mg.png",
    variants: [{ file: "wolverine-blend-20mg.png", size: "20mg" }],
  },
  {
    dir: productsDir,
    master: "glow-blend-70mg.png",
    variants: [{ file: "glow-blend-70mg.png", size: "70mg" }],
  },
  {
    dir: productsDir,
    master: "klow-blend-80mg.png",
    variants: [{ file: "klow-blend-80mg.png", size: "80mg" }],
  },
];

const fontSize = await calibrateDosageFontSize(
  TARGET_DOSAGE_INK_HEIGHT,
  "10 mg",
  "rgb(4, 34, 105)",
);

console.log(
  `Shared dosage font ${fontSize}px (target ink ${TARGET_DOSAGE_INK_HEIGHT}px)`,
);

for (const job of jobs) {
  const masterPath = path.join(job.dir, job.master);
  const region = await findDosageRegion(masterPath);

  for (const variant of job.variants) {
    const outPath = path.join(productsDir, variant.file);
    const result = await derivePackshotFromMaster(
      masterPath,
      variant.size,
      outPath,
      { region, fontSize, targetInkHeight: TARGET_DOSAGE_INK_HEIGHT },
    );
    console.log(
      `${job.master} → ${variant.file} ("${result.label}", font ${fontSize}px)`,
    );
  }
}

console.log("\nDone. All catalog vials share one dosage font.");

