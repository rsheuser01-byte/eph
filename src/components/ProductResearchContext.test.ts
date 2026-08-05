import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("ProductResearchContext wiring", () => {
  const page = readFileSync(
    path.join(process.cwd(), "src/app/products/[slug]/page.tsx"),
    "utf8",
  );
  const component = readFileSync(
    path.join(process.cwd(), "src/components/ProductResearchContext.tsx"),
    "utf8",
  );

  it("renders research interest after purchase and before specs", () => {
    expect(page).toMatch(/ProductPurchase/);
    expect(page).toMatch(/ProductSpecs/);
    expect(page).toMatch(/ProductResearchContext/);

    const purchaseIdx = page.indexOf("<ProductPurchase");
    const researchIdx = page.indexOf("<ProductResearchContext");
    const specsIdx = page.indexOf("<ProductSpecs");
    expect(purchaseIdx).toBeGreaterThan(-1);
    expect(researchIdx).toBeGreaterThan(purchaseIdx);
    expect(specsIdx).toBeGreaterThan(researchIdx);
  });

  it("shows scannable interest points and a collapsed details accordion", () => {
    expect(component).toMatch(/Why researchers are interested/);
    expect(component).toMatch(/interestPoints/);
    expect(component).toMatch(/aria-expanded/);
    expect(component).toMatch(/aria-controls/);
    expect(component).toMatch(/Research details and references/);
    expect(component).toMatch(/useState\(false\)/);
    expect(component).toMatch(/citations/);
    expect(component).toMatch(/rel=["']noopener noreferrer["']/);
    expect(component).toMatch(/target=["']_blank["']/);
  });
});
