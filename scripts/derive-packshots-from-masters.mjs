import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  calibrateDosageFontSize,
  derivePackshotFromMaster,
  findDosageRegion,
  formatDosageLabel,
} from "./lib/packshotFromMaster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsDir = path.join(__dirname, "..", "public", "products");
const mastersDir = path.join(__dirname, "..", "packshot-masters");

/**
 * Photographic masters live in /packshot-masters. Every catalog size is
 * stamped with one calibrated dosage font so text stays the same size when
 * switching vials.
 */
const jobs = [
  {
    master: "glp-3-15mg.png",
    variants: [
      { file: "glp-3-10mg.png", size: "10mg" },
      { file: "glp-3-15mg.png", size: "15mg" },
      { file: "glp-3-30mg.png", size: "30mg" },
      { file: "glp-3-60mg.png", size: "60mg" },
    ],
  },
  {
    master: "glp-2-10mg.png",
    variants: [
      { file: "glp-2-10mg.png", size: "10mg" },
      { file: "glp-2-20mg.png", size: "20mg" },
      { file: "glp-2-30mg.png", size: "30mg" },
    ],
  },
  {
    master: "mots-c-10mg.png",
    variants: [
      { file: "mots-c-10mg.png", size: "10mg" },
      { file: "mots-c-20mg.png", size: "20mg" },
    ],
  },
  {
    master: "tesamorelin-5mg.png",
    variants: [
      { file: "tesamorelin-5mg.png", size: "5mg" },
      { file: "tesamorelin-10mg.png", size: "10mg" },
    ],
  },
  {
    master: "nad-100mg.png",
    variants: [
      { file: "nad-100mg.png", size: "100mg" },
      { file: "nad-500mg.png", size: "500mg" },
      { file: "nad-1000mg.png", size: "1000mg" },
    ],
  },
  {
    master: "bac-10ml.png",
    variants: [
      { file: "bac-10ml.png", size: "10ml" },
      { file: "bac-30ml.png", size: "30ml" },
    ],
  },
];

for (const job of jobs) {
  const masterPath = path.join(mastersDir, job.master);
  const region = await findDosageRegion(masterPath);
  const fill = `rgb(${region.ink[0]}, ${region.ink[1]}, ${region.ink[2]})`;
  const fontSize = await calibrateDosageFontSize(
    region.textHeight,
    formatDosageLabel(job.variants[0].size),
    fill,
  );

  for (const variant of job.variants) {
    const outPath = path.join(productsDir, variant.file);
    const result = await derivePackshotFromMaster(
      masterPath,
      variant.size,
      outPath,
      { region, fontSize },
    );
    console.log(
      `${job.master} → ${variant.file} ("${result.label}", font ${fontSize}px)`,
    );
  }
}

console.log(
  "\nDone. All sizes share one calibrated dosage font per product.",
);
