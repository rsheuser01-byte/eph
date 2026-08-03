import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("RelatedProducts wiring", () => {
  const page = readFileSync(
    path.join(process.cwd(), "src/app/products/[slug]/page.tsx"),
    "utf8",
  );
  const component = readFileSync(
    path.join(process.cwd(), "src/components/RelatedProducts.tsx"),
    "utf8",
  );
  const purchase = readFileSync(
    path.join(process.cwd(), "src/components/RelatedProductPurchase.tsx"),
    "utf8",
  );

  it("renders related products after research context and before institutional CTA", () => {
    expect(page).toMatch(/RelatedProducts/);
    expect(page).toMatch(/getRelatedProducts/);

    const researchIdx = page.indexOf("<ProductResearchContext");
    const relatedIdx = page.indexOf("<RelatedProducts");
    const ctaIdx = page.indexOf("<InstitutionalCta");
    expect(researchIdx).toBeGreaterThan(-1);
    expect(relatedIdx).toBeGreaterThan(researchIdx);
    expect(ctaIdx).toBeGreaterThan(relatedIdx);
  });

  it("loads availability for related SKUs and passes it into RelatedProducts", () => {
    expect(page).toMatch(/related\.flatMap/);
    expect(page).toMatch(/availability=\{/);
    expect(component).toMatch(/availability/);
  });

  it("uses a compact photo + reason layout with inline purchase controls", () => {
    expect(component).toMatch(/aria-labelledby=["']related-products["']/);
    expect(component).toMatch(/from "next\/image"/);
    expect(component).toMatch(/productPrimaryImage/);
    expect(component).toMatch(/item\.reason/);
    expect(component).toMatch(/RelatedProductPurchase/);
    expect(component).toMatch(/sm:grid-cols-2/);
    expect(component).not.toMatch(/product-card/);
    expect(component).not.toMatch(/ProductCard/);
  });

  it("offers size selection when needed and an add-to-cart action", () => {
    expect(purchase).toMatch(/"use client"/);
    expect(purchase).toMatch(/defaultInStockSize/);
    expect(purchase).toMatch(/resolveInStockSize/);
    expect(purchase).toMatch(/useCart/);
    expect(purchase).toMatch(/Add to cart/);
    expect(purchase).toMatch(/variants\.length > 1/);
    expect(purchase).toMatch(/setSize/);
  });
});
