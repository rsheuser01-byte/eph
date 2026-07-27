import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePackshotDir } from "./lib/packshotFrame.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsDir = path.join(__dirname, "..", "public", "products");

const results = await normalizePackshotDir(productsDir);

for (const { file, before, after } of results) {
  const bH = (before.heightRatio * 100).toFixed(1);
  const aH = (after.heightRatio * 100).toFixed(1);
  console.log(
    `${file}: ${before.canvasWidth}x${before.canvasHeight} @${bH}%h → ${after.canvasWidth}x${after.canvasHeight} @${aH}%h`,
  );
}

console.log(`\nNormalized ${results.length} packshots in ${productsDir}`);
