import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const productsData = path.join(root, "src/data/products.ts");
const outDir = path.join(root, "public/products/catalog");
const WIDTH = 480;

/**
 * Build lightweight WebP catalog thumbs from each product's primary packshot.
 * Used by compact ProductCard tiles (homepage) so we don't decode 1024² PNGs.
 */
const src = await fs.readFile(productsData, "utf8");
const parts = src.split(/\{\s*slug:/).slice(1);
const products = [];

for (const part of parts) {
  const slug = part.match(/^\s*"([^"]+)"/)?.[1];
  const img = part.match(/image:\s*"([^"]+)"/)?.[1];
  if (slug && img) {
    products.push({ slug, img });
  }
}

await fs.mkdir(outDir, { recursive: true });

for (const { slug, img } of products) {
  const input = path.join(root, "public", img.replace(/^\//, ""));
  const output = path.join(outDir, `${slug}.webp`);
  await sharp(input)
    .resize(WIDTH, WIDTH, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .webp({ quality: 68, effort: 4 })
    .toFile(output);
  const kb = Math.round((await fs.stat(output)).size / 1024);
  console.log(`${slug} → ${kb}KB`);
}

console.log(`\nWrote ${products.length} catalog thumbs to ${outDir}`);
