import { describe, expect, it } from "vitest";
import { products } from "./products";
import {
  getProductResearch,
  productResearchBySlug,
  researchWordCount,
} from "./productResearch";

/** Soft floor for a scannable research block (Phase 3 #1). */
const MIN_UNIQUE_WORDS = 150;

const THERAPEUTIC_CLAIM_PATTERN =
  /\b(treat(?:s|ment|ing)?|cure[sd]?|diagnos(?:e|is|ing)|for human (?:use|consumption)|take \d|dose(?:d|s|age)? for)\b/i;

describe("product research context (Phase 3 #1)", () => {
  it("covers every catalog product", () => {
    for (const product of products) {
      expect(
        getProductResearch(product.slug),
        `missing research context for ${product.slug}`,
      ).toBeDefined();
    }
  });

  it("uses 2–3 scannable sections with non-empty copy", () => {
    for (const product of products) {
      const research = getProductResearch(product.slug)!;
      expect(research.sections.length).toBeGreaterThanOrEqual(2);
      expect(research.sections.length).toBeLessThanOrEqual(3);
      for (const section of research.sections) {
        expect(section.heading.length).toBeGreaterThan(0);
        expect(section.paragraphs.length).toBeGreaterThan(0);
        for (const paragraph of section.paragraphs) {
          expect(paragraph.trim().length).toBeGreaterThan(40);
        }
      }
    }
  });

  it("meets the ~150 unique-word research floor per SKU", () => {
    const short = products
      .map((product) => {
        const words = researchWordCount(getProductResearch(product.slug)!);
        return { slug: product.slug, words };
      })
      .filter((entry) => entry.words < MIN_UNIQUE_WORDS);
    expect(short).toEqual([]);
  });

  it("keeps research copy unique across SKUs", () => {
    const bodies = products.map((product) => {
      const research = getProductResearch(product.slug)!;
      return research.sections
        .flatMap((section) => section.paragraphs)
        .join("\n");
    });
    expect(new Set(bodies).size).toBe(bodies.length);
  });

  it("includes at least one primary citation per product", () => {
    for (const product of products) {
      const research = getProductResearch(product.slug)!;
      expect(research.citations.length).toBeGreaterThan(0);
      for (const citation of research.citations) {
        expect(citation.label.length).toBeGreaterThan(0);
        expect(citation.href).toMatch(/^https:\/\//);
      }
    }
  });

  it("stays in research/lab framing without therapeutic claim language", () => {
    for (const product of products) {
      const research = getProductResearch(product.slug)!;
      const text = [
        ...research.sections.flatMap((section) => [
          section.heading,
          ...section.paragraphs,
        ]),
        ...research.citations.map((citation) => citation.label),
      ].join(" ");
      expect(text).toMatch(/research|laborator|in vitro|assay|bench/i);
      expect(text).not.toMatch(THERAPEUTIC_CLAIM_PATTERN);
    }
  });

  it("exports a stable slug map matching getProductResearch", () => {
    expect(Object.keys(productResearchBySlug).sort()).toEqual(
      products.map((product) => product.slug).sort(),
    );
  });
});
