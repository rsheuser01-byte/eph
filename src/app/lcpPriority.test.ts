import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("LCP image priority (Phase 2 #4)", () => {
  it("renders the homepage hero as a priority Image, not a CSS background-only div", () => {
    const home = readFileSync(
      path.join(process.cwd(), "src/app/page.tsx"),
      "utf8",
    );
    const css = readFileSync(
      path.join(process.cwd(), "src/app/globals.css"),
      "utf8",
    );

    expect(home).toMatch(/hero-banner\.png/);
    expect(home).toMatch(/priority/);
    expect(home).toMatch(/from "next\/image"/);
    expect(css).not.toMatch(
      /\.hero-banner-media\s*\{[^}]*background-image:/s,
    );
  });

  it("marks the first /products catalog card as priority", () => {
    const productsPage = readFileSync(
      path.join(process.cwd(), "src/app/products/page.tsx"),
      "utf8",
    );
    const card = readFileSync(
      path.join(process.cwd(), "src/components/ProductCard.tsx"),
      "utf8",
    );

    expect(card).toMatch(/priority\?\: boolean/);
    expect(productsPage).toMatch(/priority=\{index === 0\}/);
  });
});
