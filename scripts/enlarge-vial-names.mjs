/**
 * ONE-OFF: restamp PT-141, SS-31, 5-Amino-1MQ, and Semax names larger than
 * the photographed short codes so they read on catalog tiles. Not a build
 * step.
 * `node scripts/enlarge-vial-names.mjs` (optional filter: `semax`)
 */
import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  calibrateDosageFontSize,
  derivePackshotFromMaster,
  findDosageRegion,
} from "./lib/packshotFromMaster.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const productsDir = path.join(__dirname, "..", "public", "products");
const masterPath = path.join(productsDir, "mt-2-10mg.png");

/**
 * Match photographed MT-2 name ink. Width cap is Tesamorelin so
 * longer codes like PT-141 don't run off the label.
 */
const MAX_INK_WIDTH = 268;

const jobs = [
  { file: "ss-31-10mg.png", label: "SS-31" },
  { file: "pt-141-10mg.png", label: "PT-141" },
  { file: "5-amino-1mq-50mg.png", label: "5-Amino-1MQ", size: "50mg" },
  { file: "semax-10mg.png", label: "Semax" },
];

const filter = process.argv[2];
const selected = filter
  ? jobs.filter((job) => job.file.includes(filter) || job.label.includes(filter))
  : jobs;

if (selected.length === 0) {
  throw new Error(`No enlarge-vial-names job matched "${filter}"`);
}

async function findNameRegion(filePath, dosage) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const x0 = Math.floor(width * 0.28);
  const x1 = Math.floor(width * 0.72);
  const y0 = Math.floor(height * 0.70);
  const y1 = dosage.textTop - 8;

  function isNavy(x, y) {
    const i = (y * width + x) * channels;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = channels === 4 ? data[i + 3] : 255;
    if (a < 180) return false;
    const lum = (r + g + b) / 3;
    return lum < 145 && r < 120 && b >= r - 10;
  }

  const rows = [];
  for (let y = y0; y <= y1; y++) {
    let ink = 0;
    let minX = width;
    let maxX = 0;
    for (let x = x0; x <= x1; x++) {
      if (isNavy(x, y)) {
        ink++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    if (ink >= 8) {
      rows.push({ y, ink, minX, maxX });
    }
  }

  const bands = [];
  let current = null;
  for (const row of rows) {
    if (!current || row.y > current.y1 + 2) {
      if (current) bands.push(current);
      current = {
        y0: row.y,
        y1: row.y,
        minX: row.minX,
        maxX: row.maxX,
        ink: row.ink,
      };
    } else {
      current.y1 = row.y;
      current.minX = Math.min(current.minX, row.minX);
      current.maxX = Math.max(current.maxX, row.maxX);
      current.ink += row.ink;
    }
  }
  if (current) bands.push(current);

  const candidates = bands
    .map((band) => {
      const bandHeight = band.y1 - band.y0 + 1;
      const bandWidth = band.maxX - band.minX + 1;
      return {
        ...band,
        bandHeight,
        bandWidth,
        density: band.ink / (bandHeight * bandWidth),
      };
    })
    .filter(
      (band) =>
        band.bandHeight >= 14 &&
        band.bandHeight <= 56 &&
        band.bandWidth >= 40 &&
        band.bandWidth <= 240,
    )
    .sort((a, b) => b.bandHeight - a.bandHeight || b.density - a.density);

  const name = candidates[0];
  if (!name) {
    throw new Error(`Could not locate product name in ${filePath}`);
  }

  const inkColors = [];
  for (let y = name.y0; y <= name.y1; y++) {
    for (let x = name.minX; x <= name.maxX; x++) {
      if (isNavy(x, y)) {
        const i = (y * width + x) * channels;
        inkColors.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
  }
  inkColors.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  const ink = inkColors[Math.floor(inkColors.length * 0.35)] ?? [4, 34, 105];

  return {
    data,
    canvasWidth: width,
    canvasHeight: height,
    channels,
    textLeft: name.minX,
    textTop: name.y0,
    textWidth: name.bandWidth,
    textHeight: name.bandHeight,
    ink,
  };
}

async function calibrateNameFontSize(
  targetInkHeight,
  maxInkWidth,
  sampleLabel,
  fill,
) {
  let bestSize = 40;
  let bestHeight = 0;

  for (let fontSize = 40; fontSize <= 160; fontSize++) {
    const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="140" xmlns="http://www.w3.org/2000/svg">
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="Arial, Helvetica, 'Segoe UI', sans-serif"
    font-size="${fontSize}" font-weight="700" fill="${fill}">${sampleLabel}</text>
</svg>`);
    const { data, info } = await sharp(svg)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let minY = info.height;
    let maxY = 0;
    let minX = info.width;
    let maxX = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const i = (y * info.width + x) * info.channels;
        if (data[i + 3] < 180) continue;
        if ((data[i] + data[i + 1] + data[i + 2]) / 3 > 200) continue;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    if (maxY < minY || maxX < minX) continue;
    const height = maxY - minY + 1;
    const width = maxX - minX + 1;
    if (height > targetInkHeight || width > maxInkWidth) continue;
    if (height >= bestHeight) {
      bestHeight = height;
      bestSize = fontSize;
    }
  }

  return bestSize;
}

function fillRectFromRow(data, info, x0, y0, x1, y1, probeY) {
  const { width, channels } = info;
  const out = Buffer.from(data);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const src = (probeY * width + x) * channels;
      const dst = (y * width + x) * channels;
      out[dst] = data[src];
      out[dst + 1] = data[src + 1];
      out[dst + 2] = data[src + 2];
      if (channels === 4) out[dst + 3] = 255;
    }
  }
  return out;
}

const dosage = await findDosageRegion(masterPath);
const region = await findNameRegion(masterPath, dosage);
const fill = `rgb(${region.ink[0]}, ${region.ink[1]}, ${region.ink[2]})`;
const targetInkHeight = region.textHeight;
const nameCenterY = region.textTop + region.textHeight / 2;

console.log(
  `MT-2 name ink ${region.textWidth}x${region.textHeight} at y ${region.textTop}`,
);

const TARGET_DOSAGE_INK_HEIGHT = 32;
const dosageFontSize = await calibrateDosageFontSize(
  TARGET_DOSAGE_INK_HEIGHT,
  "10 mg",
  fill,
);

for (const job of selected) {
  const outPath = path.join(productsDir, job.file);
  await copyFile(masterPath, outPath);

  const fontSize = await calibrateNameFontSize(
    targetInkHeight,
    MAX_INK_WIDTH,
    job.label,
    fill,
  );

  const centerX = region.textLeft + region.textWidth / 2;
  const centerY = nameCenterY;
  const padX = 48;
  const padY = 10;
  const patchW = Math.max(region.textWidth + padX * 2, 320);
  const patchH = targetInkHeight + padY * 2;
  const x0 = Math.max(0, Math.round(centerX - patchW / 2));
  const x1 = Math.min(region.canvasWidth - 1, x0 + patchW - 1);
  const y0 = Math.max(0, Math.round(centerY - patchH / 2));
  const y1 = Math.min(region.canvasHeight - 1, y0 + patchH - 1);

  const probeY = 700;

  const masterPng = await sharp(outPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cleaned = fillRectFromRow(
    masterPng.data,
    masterPng.info,
    x0,
    y0,
    x1,
    y1,
    probeY,
  );

  const patchWidth = x1 - x0 + 1;
  const patchHeight = y1 - y0 + 1;
  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${patchWidth}" height="${patchHeight}" viewBox="0 0 ${patchWidth} ${patchHeight}" xmlns="http://www.w3.org/2000/svg">
  <text
    x="50%"
    y="50%"
    dominant-baseline="central"
    text-anchor="middle"
    font-family="Arial, Helvetica, 'Segoe UI', sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="${fill}"
  >${job.label}</text>
</svg>`);

  const base = await sharp(cleaned, {
    raw: {
      width: masterPng.info.width,
      height: masterPng.info.height,
      channels: masterPng.info.channels,
    },
  })
    .png()
    .toBuffer();

  await sharp(base)
    .composite([{ input: svg, left: x0, top: y0 }])
    .png()
    .toFile(outPath);

  if (job.size && job.size !== "10mg") {
    const result = await derivePackshotFromMaster(
      outPath,
      job.size,
      outPath,
      {
        fontSize: dosageFontSize,
        targetInkHeight: TARGET_DOSAGE_INK_HEIGHT,
      },
    );
    console.log(
      `${job.file}: dosage "${result.label}" font ${dosageFontSize}px (shared ${TARGET_DOSAGE_INK_HEIGHT}px ink)`,
    );
  }

  console.log(
    `${job.file}: "${job.label}" font ${fontSize}px (match MT-2 ink ${targetInkHeight}px tall)`,
  );
}
