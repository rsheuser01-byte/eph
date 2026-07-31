import { describe, expect, it } from "vitest";
import { products } from "@/data/products";
import { buildProductSpecSections } from "./productSpecQuestions";

describe("buildProductSpecSections (Phase 3 #8)", () => {
  it("builds question headings and direct answers for every catalog SKU", () => {
    for (const product of products) {
      const sections = buildProductSpecSections(product);
      expect(sections.length).toBeGreaterThanOrEqual(2);
      for (const section of sections) {
        expect(section.question.endsWith("?")).toBe(true);
        expect(section.question).toContain(product.name);
        expect(section.answer.trim().split(/\s+/).length).toBeGreaterThanOrEqual(12);
        expect(section.answer).toMatch(/research|laborator|bench|reconstitution|storage|supplied/i);
      }
    }
  });

  it("includes synonym context for GLP-3", () => {
    const glp3 = products.find((product) => product.slug === "glp-3")!;
    const sections = buildProductSpecSections(glp3);
    expect(sections[0]!.question).toMatch(/Retatrutide/i);
    expect(sections[0]!.answer).toMatch(/GIP|GLP-1|glucagon/i);
  });
});
