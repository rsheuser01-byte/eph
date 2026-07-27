import sharp from "sharp";
import { copyFile, unlink, rename } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { findDosageRegion, formatDosageLabel } from "./packshotFromMaster.mjs";

/**
 * @param {Buffer} data
 * @param {number} width
 * @param {number} channels
 * @param {number} x
 * @param {number} y
 */
function isTextPixel(data, width, channels, x, y) {
  const i = (y * width + x) * channels;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = channels === 4 ? data[i + 3] : 255;
  if (a < 180) return false;
  const lum = (r + g + b) / 3;
  // Navy ink + soft anti-aliased fringe on white label.
  if (lum < 210 && r < 180) return true;
  return r < 220 && b > r + 8 && g < 230 && lum < 235;
}

/**
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
 * Exact master photo + dosage text pixels taken from an edited image.
 * Everything outside the dosage band stays byte-identical to the master.
 *
 * @param {string} masterPath
 * @param {string} editPath AI edit that attempted to change only the dosage
 * @param {string} outputPath
 * @param {string} newSize catalog size for labeling/metadata
 */
export async function lockDosageEditOntoMaster(
  masterPath,
  editPath,
  outputPath,
  newSize,
) {
  const label = formatDosageLabel(newSize);
  const masterDose = await findDosageRegion(masterPath);

  const masterRaw = await sharp(masterPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const editRaw = await sharp(editPath)
    .resize(masterRaw.info.width, masterRaw.info.height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let editDose;
  try {
    // Write resized edit to a temp file so findDosageRegion can read it,
    // or locate dosage on the in-memory buffer via a tiny helper path.
    editDose = await findDosageRegion(editPath);
  } catch {
    editDose = masterDose;
  }

  // If the edit was resized from a different aspect, prefer master geometry
  // and search dosage on the resized buffer manually when sizes differ.
  if (
    editRaw.info.width !== masterDose.canvasWidth ||
    editRaw.info.height !== masterDose.canvasHeight
  ) {
    editDose = masterDose;
  }

  const padX = 24;
  const padY = 10;
  const clearX0 = Math.max(0, masterDose.textLeft - padX);
  const clearX1 = Math.min(
    masterDose.canvasWidth - 1,
    masterDose.textLeft + masterDose.textWidth - 1 + padX,
  );
  const clearY0 = Math.max(0, masterDose.textTop - padY);
  const clearY1 = Math.min(
    masterDose.canvasHeight - 1,
    masterDose.textTop + masterDose.textHeight - 1 + padY,
  );

  let probeY = masterDose.textTop - 6;
  while (probeY > masterDose.textTop - 24 && probeY > 0) {
    let ink = 0;
    for (let x = clearX0; x <= clearX1; x++) {
      const i = (probeY * masterRaw.info.width + x) * masterRaw.info.channels;
      const r = masterRaw.data[i];
      const g = masterRaw.data[i + 1];
      const b = masterRaw.data[i + 2];
      const lum = (r + g + b) / 3;
      if (lum < 145 && r < 120) ink++;
    }
    if (ink < 3) break;
    probeY--;
  }
  probeY = Math.max(0, probeY);

  let out = fillRectFromRow(
    masterRaw.data,
    masterRaw.info,
    clearX0,
    clearY0,
    clearX1,
    clearY1,
    probeY,
  );

  const masterCx = masterDose.textLeft + masterDose.textWidth / 2;
  const masterCy = masterDose.textTop + masterDose.textHeight / 2;
  const editCx = editDose.textLeft + editDose.textWidth / 2;
  const editCy = editDose.textTop + editDose.textHeight / 2;
  const dx = Math.round(masterCx - editCx);
  const dy = Math.round(masterCy - editCy);

  const stampPadX = 18;
  const stampPadY = 8;
  const sx0 = Math.max(0, editDose.textLeft - stampPadX);
  const sx1 = Math.min(
    editRaw.info.width - 1,
    editDose.textLeft + editDose.textWidth - 1 + stampPadX,
  );
  const sy0 = Math.max(0, editDose.textTop - stampPadY);
  const sy1 = Math.min(
    editRaw.info.height - 1,
    editDose.textTop + editDose.textHeight - 1 + stampPadY,
  );

  const w = masterRaw.info.width;
  const h = masterRaw.info.height;
  const ch = masterRaw.info.channels;

  for (let y = sy0; y <= sy1; y++) {
    for (let x = sx0; x <= sx1; x++) {
      if (!isTextPixel(editRaw.data, editRaw.info.width, editRaw.info.channels, x, y)) {
        continue;
      }
      const tx = x + dx;
      const ty = y + dy;
      if (tx < clearX0 || tx > clearX1 || ty < clearY0 || ty > clearY1) {
        continue;
      }
      if (tx < 0 || ty < 0 || tx >= w || ty >= h) continue;
      const si = (y * editRaw.info.width + x) * editRaw.info.channels;
      const di = (ty * w + tx) * ch;
      out[di] = editRaw.data[si];
      out[di + 1] = editRaw.data[si + 1];
      out[di + 2] = editRaw.data[si + 2];
      if (ch === 4) out[di + 3] = 255;
    }
  }

  const dir = path.dirname(outputPath);
  const tempPath = path.join(
    dir,
    `.packshot-tmp-${randomBytes(8).toString("hex")}.png`,
  );

  try {
    await sharp(out, {
      raw: { width: w, height: h, channels: ch },
    })
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
    patchLeft: clearX0,
    patchTop: clearY0,
    patchWidth: clearX1 - clearX0 + 1,
    patchHeight: clearY1 - clearY0 + 1,
  };
}

/**
 * Fallback: exact master copy with SVG dosage (no AI edit available).
 * Re-export derive from packshotFromMaster for the CLI.
 */
export { derivePackshotFromMaster } from "./packshotFromMaster.mjs";
