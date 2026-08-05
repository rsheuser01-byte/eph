import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { site } from "@/data/site";
import { trustSignals } from "@/data/trustSignals";
import {
  TERMS_SECTION_IDS,
  getTermsSectionIds,
  termsIntro,
  termsSections,
} from "./termsContent";

function flattenParts(
  parts: Array<string | { href: string; label: string }>,
): string {
  return parts
    .map((part) => (typeof part === "string" ? part : part.label))
    .join("");
}

function allTermsText(): string {
  const chunks = [
    ...termsIntro.map(flattenParts),
    ...termsSections.flatMap((section) => [
      section.heading,
      ...section.paragraphs.map(flattenParts),
      ...(section.bullets ?? []),
    ]),
  ];
  return chunks.join("\n");
}

describe("termsContent", () => {
  it("exports every planned section id in order", () => {
    expect(getTermsSectionIds()).toEqual([...TERMS_SECTION_IDS]);
  });

  it("keeps section ids unique and non-empty", () => {
    const ids = getTermsSectionIds();
    expect(new Set(ids).size).toBe(ids.length);
    for (const section of termsSections) {
      expect(section.id.length).toBeGreaterThan(0);
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.paragraphs.length).toBeGreaterThan(0);
    }
  });

  it("covers RUO, age, Kentucky law, email/SMS communications, and support contact", () => {
    const text = allTermsText();
    expect(text).toMatch(/research use only/i);
    expect(text).toContain(String(site.ageMinimum));
    expect(text).toMatch(/Kentucky/i);
    expect(text).toContain(site.email);
    expect(text).toContain(
      trustSignals.legalEntityName ?? site.name,
    );
    expect(text).toMatch(/SMS|text message/i);
    expect(text).toMatch(/STOP/);
    expect(text).toMatch(/electronic communications/i);
    expect(getTermsSectionIds()).toContain("electronic-communications");
  });

  it("cross-links Privacy and Refunds policies", () => {
    const hrefs = termsSections.flatMap((section) =>
      section.paragraphs.flatMap((paragraph) =>
        paragraph
          .filter(
            (part): part is { href: string; label: string } =>
              typeof part !== "string",
          )
          .map((part) => part.href),
      ),
    );
    expect(hrefs).toContain("/privacy");
    expect(hrefs).toContain("/refunds");
  });
});

describe("terms page wiring", () => {
  it("renders structured terms content on /terms", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/app/terms/page.tsx"),
      "utf8",
    );
    expect(source).toMatch(/termsSections/);
    expect(source).toMatch(/termsIntro/);
    expect(source).toMatch(/LastUpdated/);
    expect(source).toMatch(/legalPagesUpdatedOn\.terms/);
  });
});
