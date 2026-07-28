import sharp from "sharp";
import { readdir, mkdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

/** Square packshot canvas. */
export const PACKSHOT_SIZE = 1024;
/** Bottle (+ soft shadow) height as a fraction of the canvas. */
export const TARGET_CONTENT_HEIGHT_RATIO = 0.9;
/** Near-white RGB threshold treated as background. */
export const BG_THRESHOLD = 248;
/** Stronger threshold so soft drop-shadows are excluded from vial-body centering. */
export const VIAL_BODY_THRESHOLD = 235;
/** Min non-bg pixels in a row/col before it counts as content (ignores edge dust). */
export const MIN_DENSITY = 4;
/** Column must cover this fraction of canvas height to count as vial body. */
export const VIAL_COL_HEIGHT_FRACTION = 0.08;

/**
 * @param {Buffer} raw
 * @param {number} width
 * @param {number} height
 * @param {number} channels
 * @param {number} threshold
 * @param {number} [colMinHits]
 */
function boundsFromThreshold(
  raw,
  width,
  height,
  channels,
  threshold,
  colMinHits = MIN_DENSITY,
) {
  const rowHits = new Array(height).fill(0);
  const colHits = new Array(width).fill(0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = raw[i];
      const g = raw[i + 1];
      const b = raw[i + 2];
      const a = channels === 4 ? raw[i + 3] : 255;
      const isBg =
        a < 8 || (r > threshold && g > threshold && b > threshold);
      if (!isBg) {
        rowHits[y]++;
        colHits[x]++;
      }
    }
  }

  let minY = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    if (rowHits[y] >= MIN_DENSITY) {
      if (minY < 0) minY = y;
      maxY = y;
    }
  }

  let minX = -1;
  let maxX = -1;
  for (let x = 0; x < width; x++) {
    if (colHits[x] >= colMinHits) {
      if (minX < 0) minX = x;
      maxX = x;
    }
  }

  if (minX < 0 || minY < 0) {
    return null;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/**
 * Soft content bounds (includes drop shadow) — used for crop/scale.
 * @param {Buffer} raw
 * @param {number} width
 * @param {number} height
 * @param {number} channels
 */
export function contentBounds(raw, width, height, channels) {
  return boundsFromThreshold(raw, width, height, channels, BG_THRESHOLD);
}

/**
 * Opaque vial/label bounds (excludes soft shadow) — used for horizontal centering.
 * @param {Buffer} raw
 * @param {number} width
 * @param {number} height
 * @param {number} channels
 */
export function vialBodyBounds(raw, width, height, channels) {
  const colMinHits = Math.max(
    MIN_DENSITY,
    Math.floor(height * VIAL_COL_HEIGHT_FRACTION),
  );
  return boundsFromThreshold(
    raw,
    width,
    height,
    channels,
    VIAL_BODY_THRESHOLD,
    colMinHits,
  );
}

/**
 * @param {string} filePath
 */
export async function measurePackshot(filePath) {
  const image = sharp(filePath);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bounds = contentBounds(data, info.width, info.height, info.channels);
  if (!bounds) {
    throw new Error(`No content found in ${filePath}`);
  }

  const body = vialBodyBounds(data, info.width, info.height, info.channels);
  const bodyCenterX = body
    ? (body.minX + body.maxX) / 2
    : (bounds.minX + bounds.maxX) / 2;

  return {
    canvasWidth: info.width,
    canvasHeight: info.height,
    contentWidth: bounds.width,
    contentHeight: bounds.height,
    bounds,
    body,
    bodyCenterX,
    bodyOffsetX: bodyCenterX - info.width / 2,
    heightRatio: bounds.height / info.height,
    widthRatio: bounds.width / info.width,
  };
}

/**
 * Crop to content, scale to a shared height, center vial body on a white 1024² canvas.
 * @param {string} inputPath
 * @param {string} outputPath
 */
export async function normalizePackshot(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bounds = contentBounds(data, info.width, info.height, info.channels);
  if (!bounds) {
    throw new Error(`No content found in ${inputPath}`);
  }
  const body =
    vialBodyBounds(data, info.width, info.height, info.channels) ?? bounds;

  const targetH = Math.round(PACKSHOT_SIZE * TARGET_CONTENT_HEIGHT_RATIO);
  const scale = targetH / bounds.height;
  const scaledW = Math.max(1, Math.round(bounds.width * scale));
  const scaledH = targetH;

  const extracted = await sharp(inputPath)
    .extract({
      left: bounds.minX,
      top: bounds.minY,
      width: bounds.width,
      height: bounds.height,
    })
    .resize(scaledW, scaledH, { fit: "fill" })
    .ensureAlpha()
    .png()
    .toBuffer();

  // Center the opaque vial body (not the soft shadow) on the canvas.
  const bodyCenterInExtract = (body.minX + body.maxX) / 2 - bounds.minX;
  const scaledBodyCenterX = bodyCenterInExtract * scale;
  const left = Math.round(PACKSHOT_SIZE / 2 - scaledBodyCenterX);
  const top = Math.round((PACKSHOT_SIZE - scaledH) / 2);

  const dir = path.dirname(outputPath);
  const tempPath = path.join(
    dir,
    `.packshot-tmp-${randomBytes(8).toString("hex")}.png`,
  );

  try {
    await sharp({
      create: {
        width: PACKSHOT_SIZE,
        height: PACKSHOT_SIZE,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([{ input: extracted, left, top }])
      .png()
      .toFile(tempPath);

    // Windows rename cannot replace an existing file.
    await unlink(outputPath).catch(() => {});
    await rename(tempPath, outputPath);
  } catch (error) {
    await unlink(tempPath).catch(() => {});
    throw error;
  }

  return measurePackshot(outputPath);
}

/**
 * @param {string} dir
 */
export async function listPngs(dir) {
  const names = await readdir(dir);
  return names
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .map((name) => path.join(dir, name))
    .sort();
}

/**
 * @param {string} inputDir
 * @param {string | { onlyFiles?: string[] }} [outputDirOrOptions]
 * @param {{ onlyFiles?: string[] }} [maybeOptions]
 */
export async function normalizePackshotDir(
  inputDir,
  outputDirOrOptions = inputDir,
  maybeOptions = {},
) {
  const outputDir =
    typeof outputDirOrOptions === "string" ? outputDirOrOptions : inputDir;
  const options =
    typeof outputDirOrOptions === "string" ? maybeOptions : outputDirOrOptions;

  if (outputDir !== inputDir) {
    await mkdir(outputDir, { recursive: true });
  }

  const only = options.onlyFiles
    ? new Set(options.onlyFiles.map((name) => path.basename(name)))
    : null;

  const files = (await listPngs(inputDir)).filter((file) =>
    only ? only.has(path.basename(file)) : true,
  );
  /** @type {{ file: string, before: Awaited<ReturnType<typeof measurePackshot>>, after: Awaited<ReturnType<typeof measurePackshot>> }[]} */
  const results = [];

  for (const file of files) {
    const before = await measurePackshot(file);
    const out = path.join(outputDir, path.basename(file));
    const after = await normalizePackshot(file, out);
    results.push({ file: path.basename(file), before, after });
  }

  return results;
}
