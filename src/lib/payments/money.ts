/** Convert a decimal money amount to integer cents for safe comparison. */
export function toCents(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Invalid money value.");
  }
  return Math.round(value * 100);
}

/** Parse a Bankful amount string (e.g. "1.0000") into integer cents. */
export function parseAmountToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return toCents(parsed);
}
