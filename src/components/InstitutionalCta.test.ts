import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("InstitutionalCta wiring (Phase 3 #5)", () => {
  const home = readFileSync(
    path.join(process.cwd(), "src/app/page.tsx"),
    "utf8",
  );
  const catalog = readFileSync(
    path.join(process.cwd(), "src/app/products/page.tsx"),
    "utf8",
  );
  const detail = readFileSync(
    path.join(process.cwd(), "src/app/products/[slug]/page.tsx"),
    "utf8",
  );
  const component = readFileSync(
    path.join(process.cwd(), "src/components/InstitutionalCta.tsx"),
    "utf8",
  );

  it("keeps the bulk-orders CTA on the homepage", () => {
    expect(home).toMatch(/InstitutionalCta/);
  });

  it("surfaces the CTA on the catalog and product detail pages", () => {
    expect(catalog).toMatch(/InstitutionalCta/);
    expect(detail).toMatch(/InstitutionalCta/);
  });

  it("links to contact and mentions bulk orders", () => {
    expect(component).toMatch(/\/contact/);
    expect(component).toMatch(/bulk orders/i);
  });
});
