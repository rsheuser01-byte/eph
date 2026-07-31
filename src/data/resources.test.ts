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
  });
});
