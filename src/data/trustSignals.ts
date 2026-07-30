/**
 * E-E-A-T trust signals — only values supplied by the business (or verified
 * from a partner URL they named). Do not invent people, phones, or accreditations.
 *
 * Audit refs: seo-audit/ACTION-PLAN.md Phase 1 #4, findings/content.md Finding 1,
 * findings/schema.md Finding 3.
 */
export type TrustSignals = {
  /** Legal business name if different from brand (e.g. "… LLC" / "… Inc."). */
  legalEntityName: string | null;
  /**
   * Company-level About statement when no named individual is published.
   * Prefer this over inventing a founder name.
   */
  companyStatement: string | null;
  /** Named accountable person: founder, ops lead, or QA/compliance contact. */
  accountablePersonName: string | null;
  /** Role/title for that person (e.g. "Founder", "QA Lead"). */
  accountablePersonRole: string | null;
  /** Short, factual background for About — only what you can stand behind. */
  accountablePersonBio: string | null;
  /** Street address line(s) for the business. */
  streetAddress: string | null;
  /**
   * PO Box number when mail should go to a box. Null until the number is known
   * — do not publish a blank "PO Box" line.
   */
  postOfficeBoxNumber: string | null;
  addressLocality: string | null;
  addressRegion: string | null;
  postalCode: string | null;
  addressCountry: string | null;
  /** Public phone, or null when email is the preferred contact channel. */
  telephone: string | null;
  /** Live-chat URL or widget id if used instead of/in addition to phone. */
  liveChat: string | null;
  /**
   * Named manufacturing / analytical partner for identity/purity support.
   * Accreditation strings only when verified — do not invent ISO numbers.
   */
  testingLabName: string | null;
  testingLabAccreditation: string | null;
  testingLabUrl: string | null;
  /** Social / entity profile URLs for Organization `sameAs` (omit until real). */
  sameAs: readonly string[];
};

export const trustSignals: TrustSignals = {
  legalEntityName: "Elevate Precision Health LLC",
  companyStatement:
    "Elevate Precision Health was created with a simple goal: to provide dependable research products from a company that values quality, honesty, and personal service. We understand how important it is to know who you are purchasing from, which is why we are committed to clear communication, careful sourcing, and treating every customer with the attention and respect they deserve.",
  accountablePersonName: null,
  accountablePersonRole: null,
  accountablePersonBio: null,
  streetAddress: "3801 Billtown Rd",
  // Fill in when assigned, e.g. "12345" — leave null so UI/schema omit a blank box.
  postOfficeBoxNumber: null,
  addressLocality: "Louisville",
  addressRegion: "KY",
  postalCode: "40299",
  addressCountry: "US",
  telephone: null,
  liveChat: null,
  // Name and URL from https://www.bohaipeptide.com/ (title: BoHai Peptide).
  testingLabName: "BoHai Peptide",
  testingLabAccreditation: null,
  testingLabUrl: "https://www.bohaipeptide.com/",
  sameAs: [],
};

export function hasPostalAddress(
  signals: TrustSignals = trustSignals,
): boolean {
  return Boolean(
    signals.streetAddress &&
      signals.addressLocality &&
      signals.addressRegion &&
      signals.postalCode,
  );
}

/** Single-line address for compact UI (footer, contact). */
export function formatAddressLine(
  signals: TrustSignals = trustSignals,
): string | null {
  if (!hasPostalAddress(signals)) {
    return null;
  }
  const box = signals.postOfficeBoxNumber?.trim();
  const prefix = box ? `PO Box ${box}, ` : "";
  return `${prefix}${signals.streetAddress} ${signals.addressLocality}, ${signals.addressRegion} ${signals.postalCode}`;
}

/** Multiline address parts for stacked contact blocks. */
export function formatAddressLines(
  signals: TrustSignals = trustSignals,
): string[] {
  if (!hasPostalAddress(signals)) {
    return [];
  }
  const lines: string[] = [];
  const box = signals.postOfficeBoxNumber?.trim();
  if (box) {
    lines.push(`PO Box ${box}`);
  }
  lines.push(
    signals.streetAddress!,
    `${signals.addressLocality}, ${signals.addressRegion} ${signals.postalCode}`,
  );
  return lines;
}

/**
 * Minimum publishable trust set: address + named partner, plus either a
 * company statement or a named accountable person.
 */
export function hasMinimumTrustSignals(
  signals: TrustSignals = trustSignals,
): boolean {
  const identity = Boolean(
    signals.companyStatement || signals.accountablePersonName,
  );
  return Boolean(identity && hasPostalAddress(signals) && signals.testingLabName);
}
