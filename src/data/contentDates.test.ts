import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { products } from "@/data/products";
import {
  legalPagesUpdatedOn,
  productContentUpdatedOn,
} from "@/data/contentDates";
import { isIsoDate } from "@/lib/dates/formatUpdatedOn";
import { getProductBySlug } from "@/data/products";
import { productSchema } from "@/lib/seo/structuredData";

const BASE = "https://www.elevateprecisionhealth.com";

describe("content dates (Phase 3 #7)", () => {
  it("tracks real ISO dates for privacy, terms, and refunds", () => {
    for (const date of Object.values(legalPagesUpdatedOn)) {
      expect(isIsoDate(date)).toBe(true);
    }
  });

  it("gives every catalog product a specs/content updated date", () => {
    for (const product of products) {
      const date = productContentUpdatedOn(product);
      expect(isIsoDate(date)).toBe(true);
    }
  });

  it("emits dateModified on Product JSON-LD from the content date", () => {
    const product = getProductBySlug("glp-3")!;
    const schema = productSchema(BASE, product, {});
    expect(schema.dateModified).toBe(productContentUpdatedOn(product));
  });
});

describe("Last updated wiring (Phase 3 #7)", () => {
  it("shows LastUpdated on legal and product templates", () => {
    for (const relative of [
      "src/app/privacy/page.tsx",
      "src/app/terms/page.tsx",
      "src/app/refunds/page.tsx",
      "src/components/ProductSpecs.tsx",
    ]) {
      const source = readFileSync(path.join(process.cwd(), relative), "utf8");
      expect(source).toMatch(/LastUpdated/);
    }
  });
});
