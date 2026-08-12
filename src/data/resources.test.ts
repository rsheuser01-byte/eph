import { describe, expect, it } from "vitest";
import {
  getResourceBySlug,
  resourcePages,
  resourceWordCount,
} from "./resources";

const MIN_WORDS = 250;

describe("resource pages (Phase 3 #2)", () => {
  it("ships the three planned resource topics", () => {
    expect(resourcePages.map((page) => page.slug)).toEqual([
      "research-use-only",
      "identity-and-purity",
      "reconstitution-and-storage",
    ]);
  });

  it("gives every resource unique substantive copy and citations", () => {
    const bodies = resourcePages.map((page) =>
      page.sections.flatMap((section) => section.paragraphs).join("\n"),
    );
    expect(new Set(bodies).size).toBe(bodies.length);

    for (const page of resourcePages) {
      expect(page.title.length).toBeGreaterThan(0);
      expect(page.description.length).toBeGreaterThan(40);
      expect(page.sections.length).toBeGreaterThanOrEqual(2);
      expect(resourceWordCount(page)).toBeGreaterThanOrEqual(MIN_WORDS);
      expect(page.citations.length).toBeGreaterThan(0);
      for (const citation of page.citations) {
        expect(citation.href).toMatch(/^https:\/\//);
      }
      expect(getResourceBySlug(page.slug)?.slug).toBe(page.slug);
    }
  });

  it("keeps RUO framing on the research-use-only page", () => {
    const page = getResourceBySlug("research-use-only")!;
    const text = page.sections
      .flatMap((section) => section.paragraphs)
      .join(" ");
    expect(text).toMatch(/research use only|laboratory research/i);
    expect(text).toMatch(/not for human/i);
    expect(text).toMatch(/intended solely as (?:a )?laboratory research materials?/i);
  });

  it("frames reconstitution guidance as laboratory research only", () => {
    const page = getResourceBySlug("reconstitution-and-storage")!;
    expect(page.notice?.title).toMatch(/Laboratory Research Guidance Only/i);
    expect(page.notice?.body).toMatch(/not intended as guidance for human/i);
    const text = [
      page.lede,
      ...page.sections.flatMap((section) => section.paragraphs),
    ].join(" ");
    expect(text).toMatch(/laboratory stock/i);
    expect(text).not.toMatch(/\binjection\b/i);
    expect(text).not.toMatch(/\bdosing\b/i);
  });
});
