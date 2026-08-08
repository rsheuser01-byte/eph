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
    expect(products.length).toBeGreaterThanOrEqual(11);
  });

  it("uses a two-column dense grid on small screens", () => {
    expect(home).toMatch(/grid-cols-2/);
    expect(home).toMatch(/compact/);
  });

  it("eager-loads the first row of catalog images under the hero", () => {
    expect(home).toMatch(/priority=\{index < 4\}/);
  });
});
