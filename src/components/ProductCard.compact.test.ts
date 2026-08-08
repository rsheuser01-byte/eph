import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("ProductCard compact variant", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/components/ProductCard.tsx"),
    "utf8",
  );

  it("accepts a compact prop that densifies catalog tiles", () => {
    expect(source).toMatch(/compact\?\: boolean/);
    expect(source).toMatch(/compact/);
  });

  it("omits the short description when compact", () => {
    expect(source).toMatch(/!compact \? \(/);
    expect(source).toMatch(/shortDescription/);
  });

  it("uses catalog WebP thumbs when compact", () => {
    expect(source).toMatch(/productCatalogImage/);
  });
});
