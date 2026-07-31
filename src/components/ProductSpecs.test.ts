import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("ProductSpecs question headings (Phase 3 #8)", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/components/ProductSpecs.tsx"),
    "utf8",
  );

  it("renders question-based sections before the spec table", () => {
    expect(source).toMatch(/buildProductSpecSections/);
    expect(source).toMatch(/section\.question/);
    expect(source).toMatch(/section\.answer/);
    expect(source).toMatch(/<dl[\s\S]*allRows/);
  });

  it("does not keep the old declarative Research details H2 as the sole heading", () => {
    expect(source).not.toMatch(/>\s*Research details\s*</);
  });
});
