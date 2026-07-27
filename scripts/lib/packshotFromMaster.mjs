import sharp from "sharp";
import { copyFile, unlink, rename } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

/**
 * Format catalog size ("15mg", "10ml") as label text ("15 mg", "10 ml").
 * @param {string} size
 */
export function formatDosageLabel(size) {
  const match = String(size).trim().match(/^(\d+)\s*(mg|ml)$/i);
  if (!match) {
    throw new Error(`Unrecognized size label: ${size}`);
  }
  return `${match[1]} ${match[2].toLowerCase()}`;
}

/**
 * @param {Buffer} data
 * @param {number} width
 * @param {number} channels
 * @param {number} x
 * @param {number} y
 */
function isNavyInk(data, width, channels, x, y) {
  const i = (y * width + x) * channels;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = channels === 4 ? data[i + 3] : 255;
  if (a < 180) return false;
  const lum = (r + g + b) / 3;
  return lum < 145 && r < 120 && b >= r - 10;
}

/**
 * Locate the dosage line on a master packshot (below product name, above FRUO).
 * @param {string} filePath
 */
export async function findDosageRegion(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  const x0 = Math.floor(width * 0.32);
  const x1 = Math.floor(width * 0.68);
  const y0 = Math.floor(height * 0.78);
  const y1 = Math.floor(height * 0.86);

  /** @type {{ y: number, ink: number, minX: number, maxX: number }[]} */
  const rows = [];
  for (let y = y0; y <= y1; y++) {
    let ink = 0;
    let minX = width;
    let maxX = 0;
    for (let x = x0; x <= x1; x++) {
      if (isNavyInk(data, width, channels, x, y)) {
        ink++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    if (ink >= 5) {
      rows.push({ y, ink, minX, maxX });
    }
  }

  /** @type {{ y0: number, y1: number, minX: number, maxX: number, ink: number }[]} */
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
        band.bandHeight >= 12 &&
        band.bandHeight <= 36 &&
        band.bandWidth >= 50 &&
        band.bandWidth <= 130 &&
        band.density > 0.12,
    )
    .sort((a, b) => b.density - a.density || a.y0 - b.y0);

  const dosage = candidates[0];
  if (!dosage) {
    throw new Error(`Could not locate dosage text in ${filePath}`);
  }

  /** @type {number[][]} */
  const inkColors = [];
  for (let y = dosage.y0; y <= dosage.y1; y++) {
    for (let x = dosage.minX; x <= dosage.maxX; x++) {
      if (isNavyInk(data, width, channels, x, y)) {
        const i = (y * width + x) * channels;
        inkColors.push([data[i], data[i + 1], data[i + 2]]);
      }
    }
  }
  inkColors.sort(
    (a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]),
  );
  const ink = inkColors[Math.floor(inkColors.length * 0.35)] ?? [4, 34, 105];

  return {
    data,
    info,
    canvasWidth: width,
    canvasHeight: height,
    channels,
    textLeft: dosage.minX,
    textTop: dosage.y0,
    textWidth: dosage.bandWidth,
    textHeight: dosage.bandHeight,
    ink,
  };
}

/**
 * Fill a rectangle by copying a clean label row (preserves cylinder shading).
 * @param {Buffer} data
 * @param {import('sharp').OutputInfo} info
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} probeY
 */
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

/**
 * @param {number[]} rgb
 */
function cssRgb(rgb) {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

/**
 * Exact copy of the master packshot, with ONLY the dosage line replaced.
 * Vial, lighting, logo, product name, and disclaimer stay byte-identical.
 *
 * @param {string} masterPath
 * @param {string} newSize catalog size e.g. "30mg"
 * @param {string} outputPath
 */
export async function derivePackshotFromMaster(
  masterPath,
  newSize,
  outputPath,
) {
  const label = formatDosageLabel(newSize);
  const region = await findDosageRegion(masterPath);

  const padX = 22;
  const padY = 8;
  const x0 = Math.max(0, region.textLeft - padX);
  const x1 = Math.min(
    region.canvasWidth - 1,
    region.textLeft + region.textWidth - 1 + padX,
  );
  const y0 = Math.max(0, region.textTop - padY);
  const y1 = Math.min(
    region.canvasHeight - 1,
    region.textTop + region.textHeight - 1 + padY,
  );

  let probeY = region.textTop - 6;
  while (probeY > region.textTop - 24 && probeY > 0) {
    let ink = 0;
    for (let x = x0; x <= x1; x++) {
      if (isNavyInk(region.data, region.canvasWidth, region.channels, x, probeY)) {
        ink++;
      }
    }
    if (ink < 3) break;
    probeY--;
  }
  probeY = Math.max(0, probeY);

  // Start from an exact binary copy of the master photo.
  const dir = path.dirname(outputPath);
  const tempPath = path.join(
    dir,
    `.packshot-tmp-${randomBytes(8).toString("hex")}.png`,
  );

  try {
    await copyFile(masterPath, tempPath);

    const masterPng = await sharp(tempPath)
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
    const fontSize = Math.max(18, Math.round(region.textHeight * 0.92));
    const fill = cssRgb(region.ink);

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
  >${label}</text>
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
      .toFile(tempPath);

    await unlink(outputPath).catch(() => {});
    await rename(tempPath, outputPath);
  } catch (error) {
    await unlink(tempPath).catch(() => {});
    throw error;
  }

  return {
    label,
    region,
    patchLeft: x0,
    patchTop: y0,
    patchWidth: x1 - x0 + 1,
    patchHeight: y1 - y0 + 1,
  };
}
