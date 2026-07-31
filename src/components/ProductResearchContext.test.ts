import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("ProductResearchContext wiring (Phase 3 #1)", () => {
  const page = readFileSync(
    path.join(process.cwd(), "src/app/products/[slug]/page.tsx"),
    "utf8",
  );
  const component = readFileSync(
    path.join(process.cwd(), "src/components/ProductResearchContext.tsx"),
    "utf8",
  );

  it("renders research context after purchase and specs on the product page", () => {
    expect(page).toMatch(/ProductPurchase/);
    expect(page).toMatch(/ProductSpecs/);
    expect(page).toMatch(/ProductResearchContext/);

    const purchaseIdx = page.indexOf("<ProductPurchase");
    const specsIdx = page.indexOf("<ProductSpecs");
    const researchIdx = page.indexOf("<ProductResearchContext");
    expect(purchaseIdx).toBeGreaterThan(-1);
    expect(specsIdx).toBeGreaterThan(purchaseIdx);
    expect(researchIdx).toBeGreaterThan(specsIdx);
  });

  it("uses scannable section headings and external citation links", () => {
    expect(component).toMatch(/aria-labelledby=["']product-research["']/);
    expect(component).toMatch(/sections\.map/);
    expect(component).toMatch(/citations/);
    expect(component).toMatch(/rel=["']noopener noreferrer["']/);
    expect(component).toMatch(/target=["']_blank["']/);
  });
});
