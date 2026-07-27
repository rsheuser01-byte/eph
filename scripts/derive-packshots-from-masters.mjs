import path from "node:path";
import { fileURLToPath } from "node:url";
import { derivePackshotFromMaster } from "./lib/packshotFromMaster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsDir = path.join(__dirname, "..", "public", "products");

/**
 * First variant is the master photo. Every other size is that exact photo
 * with only the dosage line changed.
 */
const jobs = [
  {
    master: "glp-3-15mg.png",
    variants: [
      { file: "glp-3-30mg.png", size: "30mg" },
      { file: "glp-3-60mg.png", size: "60mg" },
    ],
  },
  {
    master: "glp-2-10mg.png",
    variants: [
      { file: "glp-2-20mg.png", size: "20mg" },
      { file: "glp-2-30mg.png", size: "30mg" },
    ],
  },
  {
    master: "mots-c-10mg.png",
    variants: [{ file: "mots-c-20mg.png", size: "20mg" }],
  },
  {
    master: "tesamorelin-5mg.png",
    variants: [{ file: "tesamorelin-10mg.png", size: "10mg" }],
  },
  {
    master: "nad-100mg.png",
    variants: [{ file: "nad-500mg.png", size: "500mg" }],
  },
  {
    master: "bac-10ml.png",
    variants: [{ file: "bac-30ml.png", size: "30ml" }],
  },
];

for (const job of jobs) {
  const masterPath = path.join(productsDir, job.master);
  for (const variant of job.variants) {
    const outPath = path.join(productsDir, variant.file);
    const result = await derivePackshotFromMaster(
      masterPath,
      variant.size,
      outPath,
    );
    console.log(
      `${job.master} → ${variant.file} (only "${result.label}" changed)`,
    );
  }
}

console.log(
  `\nDone. Secondary sizes are exact copies of the first-size photo with only the dosage number replaced.`,
);
