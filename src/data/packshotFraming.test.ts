import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { products } from "./products";

const productsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../public/products",
);

const BG_THRESHOLD = 248;
const VIAL_BODY_THRESHOLD = 235;
const MIN_DENSITY = 4;
/** Same-product variants must share bottle height within this absolute ratio delta. */
const MAX_HEIGHT_RATIO_SPREAD = 0.015;
/** Opaque vial body center may drift this many px from canvas center. */
const MAX_BODY_OFFSET_X = 8;

async function contentHeightRatio(filePath: string): Promise<{
  canvasWidth: number;
  canvasHeight: number;
  heightRatio: number;
}> {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rowHits = new Array(info.height).fill(0);
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      const a = info.channels === 4 ? data[i + 3]! : 255;
      const isBg =
        a < 8 || (r > BG_THRESHOLD && g > BG_THRESHOLD && b > BG_THRESHOLD);
      if (!isBg) {
        rowHits[y]++;
      }
    }
  }

  let minY = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    if (rowHits[y]! >= MIN_DENSITY) {
      if (minY < 0) minY = y;
      maxY = y;
    }
  }

  expect(minY).toBeGreaterThanOrEqual(0);
  const contentHeight = maxY - minY + 1;
  return {
    canvasWidth: info.width,
    canvasHeight: info.height,
    heightRatio: contentHeight / info.height,
  };
}

describe("packshot framing", () => {
  it("uses a square 1024 canvas for every variant image", async () => {
    for (const product of products) {
      for (const variant of product.variants) {
        const filePath = path.join(
          productsDir,
          path.basename(variant.image),
        );
        const meta = await sharp(filePath).metadata();
        expect(
          { slug: product.slug, size: variant.size, w: meta.width, h: meta.height },
          `${product.slug} ${variant.size}`,
        ).toEqual({
          slug: product.slug,
          size: variant.size,
          w: 1024,
          h: 1024,
        });
      }
    }
  });

  it("keeps bottle height consistent across sizes of the same product", async () => {
    for (const product of products) {
      if (product.variants.length < 2) {
        continue;
      }

      const ratios: number[] = [];
      for (const variant of product.variants) {
        const filePath = path.join(
          productsDir,
          path.basename(variant.image),
        );
        const measured = await contentHeightRatio(filePath);
        ratios.push(measured.heightRatio);
      }

      const spread = Math.max(...ratios) - Math.min(...ratios);
      expect(
        spread,
        `${product.slug} height ratios ${ratios.map((r) => (r * 100).toFixed(1)).join(", ")}%`,
      ).toBeLessThanOrEqual(MAX_HEIGHT_RATIO_SPREAD);
    }
  });

  it("centers the vial body horizontally on every packshot", async () => {
    for (const product of products) {
      for (const variant of product.variants) {
        const filePath = path.join(
          productsDir,
          path.basename(variant.image),
        );
        const { data, info } = await sharp(filePath)
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });

        const colHits = new Array(info.width).fill(0);
        const colMinHits = Math.max(
          MIN_DENSITY,
          Math.floor(info.height * 0.08),
        );
        for (let y = 0; y < info.height; y++) {
          for (let x = 0; x < info.width; x++) {
            const i = (y * info.width + x) * info.channels;
            const r = data[i]!;
            const g = data[i + 1]!;
            const b = data[i + 2]!;
            const a = info.channels === 4 ? data[i + 3]! : 255;
            const isBg =
              a < 8 ||
              (r > VIAL_BODY_THRESHOLD &&
                g > VIAL_BODY_THRESHOLD &&
                b > VIAL_BODY_THRESHOLD);
            if (!isBg) {
              colHits[x]!++;
            }
          }
        }

        let minX = -1;
        let maxX = -1;
        for (let x = 0; x < info.width; x++) {
          if (colHits[x]! >= colMinHits) {
            if (minX < 0) minX = x;
            maxX = x;
          }
        }

        expect(minX).toBeGreaterThanOrEqual(0);
        const bodyCenterX = (minX + maxX) / 2;
        const offset = bodyCenterX - info.width / 2;
        expect(
          Math.abs(offset),
          `${product.slug} ${variant.size} body offset ${offset.toFixed(1)}px`,
        ).toBeLessThanOrEqual(MAX_BODY_OFFSET_X);
      }
    }
  });
});
