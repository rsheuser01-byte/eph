import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { products } from "@/data/products";

describe("homepage catalog (all SKUs, dense, below hero)", () => {
  const home = readFileSync(
    path.join(process.cwd(), "src/app/page.tsx"),
    "utf8",
  );

  it("places the catalog section immediately after the hero", () => {
    const heroEnd = home.indexOf("</section>");
    const catalogLabel = home.indexOf('label">Catalog');
    expect(heroEnd).toBeGreaterThan(-1);
    expect(catalogLabel).toBeGreaterThan(heroEnd);
    const notesAfterCatalog = home.indexOf("operatingNotes", catalogLabel);
    expect(notesAfterCatalog).toBeGreaterThan(catalogLabel);
  });

  it("renders every catalog product, not a featured subset", () => {
    expect(home).not.toMatch(/product\.featured/);
    expect(home).toMatch(/products\.map/);
    expect(products.length).toBeGreaterThanOrEqual(12);
    expect(products.some((product) => product.slug === "5-amino-1mq")).toBe(
      true,
    );
    expect(products.some((product) => product.slug === "semax")).toBe(true);
  });

  it("uses a two-column dense grid on small screens", () => {
    expect(home).toMatch(/grid-cols-2/);
    expect(home).toMatch(/compact/);
  });

  it("eager-loads the first row of catalog images under the hero", () => {
    expect(home).toMatch(/priority=\{index < 2\}/);
    expect(home).toMatch(/\beager\b/);
  });

  it("staggers catalog image fade-in by row", () => {
    expect(home).toMatch(/fadeDelayMs=\{Math\.floor\(index \/ 2\) \* 90\}/);
  });

  it("does not wrap the product grid in Reveal (avoids scroll-gated loading)", () => {
    const catalogHeading = home.indexOf("Research catalog");
    const gridStart = home.indexOf("grid grid-cols-2", catalogHeading);
    const slice = home.slice(catalogHeading, gridStart + 80);
    expect(slice).toMatch(/<div className="mt-8 grid grid-cols-2/);
    expect(slice).not.toMatch(/<Reveal[\s\S]*grid grid-cols-2/);
  });
});
