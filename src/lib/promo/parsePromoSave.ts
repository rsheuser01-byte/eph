import type { PromoCode } from "./types";

export type PromoSaveBody = {
  code?: unknown;
  percentOff?: unknown;
  amountOff?: unknown;
  label?: unknown;
  firstOrderOnly?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
};

export type PromoActiveBody = {
  code?: unknown;
  active?: unknown;
};

function optionalInstant(
  value: unknown,
  label: string,
): { ok: true; value: string | undefined } | { ok: false; error: string } {
  if (value === null || value === undefined || value === "") {
    return { ok: true, value: undefined };
  }
  if (typeof value !== "string") {
    return { ok: false, error: `Enter a valid ${label}.` };
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return { ok: false, error: `Enter a valid ${label}.` };
  }
  return { ok: true, value: new Date(parsed).toISOString() };
}

function money(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) {
    return Number.NaN;
  }
  return Math.round(n * 100) / 100;
}

function defaultLabel(percentOff?: number, amountOff?: number): string {
  if (typeof percentOff === "number") {
    return `${percentOff}% off`;
  }
  return `$${amountOff?.toFixed(2)} off`;
}

/** Turn an admin form into a stored promo. Saving always turns the code on. */
export function parsePromoSave(
  body: PromoSaveBody,
): { ok: true; promo: PromoCode } | { ok: false; error: string } {
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!/^[A-Z0-9]{3,24}$/.test(code)) {
    return {
      ok: false,
      error: "Code must be 3–24 letters or numbers.",
    };
  }

  const percentOff = money(body.percentOff);
  const amountOff = money(body.amountOff);
  const hasPercent = typeof percentOff === "number";
  const hasAmount = typeof amountOff === "number";
  if (Number.isNaN(percentOff) || Number.isNaN(amountOff)) {
    return { ok: false, error: "Enter a discount amount." };
  }
  if (hasPercent === hasAmount) {
    return { ok: false, error: "Use either a percent off or a dollar amount." };
  }
  if (hasPercent && (percentOff <= 0 || percentOff > 100)) {
    return { ok: false, error: "Percent off must be between 0 and 100." };
  }
  if (hasAmount && (amountOff <= 0 || amountOff > 10000)) {
    return { ok: false, error: "Dollar amount must be greater than 0." };
  }

  const starts = optionalInstant(body.startsAt, "start time");
  if (!starts.ok) {
    return starts;
  }
  const ends = optionalInstant(body.endsAt, "end time");
  if (!ends.ok) {
    return ends;
  }
  if (
    starts.value &&
    ends.value &&
    Date.parse(ends.value) <= Date.parse(starts.value)
  ) {
    return { ok: false, error: "End time must be after the start time." };
  }

  const customLabel = typeof body.label === "string" ? body.label.trim() : "";
  if (customLabel.length > 80) {
    return { ok: false, error: "Label must be 80 characters or fewer." };
  }

  return {
    ok: true,
    promo: {
      code,
      percentOff: hasPercent ? percentOff : undefined,
      amountOff: hasAmount ? amountOff : undefined,
      active: true,
      firstOrderOnly: Boolean(body.firstOrderOnly),
      label: customLabel || defaultLabel(percentOff, amountOff),
      startsAt: starts.value,
      endsAt: ends.value,
    },
  };
}

export function parsePromoActiveChange(
  body: PromoActiveBody,
): { ok: true; code: string; active: boolean } | { ok: false; error: string } {
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!/^[A-Z0-9]{3,24}$/.test(code)) {
    return { ok: false, error: "Code must be 3–24 letters or numbers." };
  }
  if (typeof body.active !== "boolean") {
    return { ok: false, error: "Active must be true or false." };
  }
  return { ok: true, code, active: body.active };
}
