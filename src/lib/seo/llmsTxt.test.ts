import { describe, expect, it } from "vitest";
import { products } from "@/data/products";
import { researchDisclaimer, site } from "@/data/site";
import { buildLlmsTxt } from "./llmsTxt";

const BASE = "https://www.elevateprecisionhealth.com";

describe("buildLlmsTxt (Phase 3 #6)", () => {
  const body = buildLlmsTxt(BASE);

  it("summarizes site purpose and research-use disclosure", () => {
    expect(body).toContain(`# ${site.name}`);
    expect(body).toMatch(/research/i);
    expect(body).toMatch(/offered for human or animal use/i);
    expect(body).toContain(researchDisclaimer.slice(0, 40));
  });

  it("lists every catalog product with a one-line description and URL", () => {
    for (const product of products) {
      expect(body).toContain(product.name);
      expect(body).toContain(`${BASE}/products/${product.slug}`);
      expect(body).toContain(product.shortDescription);
    }
  });

  it("points crawlers at key site pages", () => {
    expect(body).toContain(`${BASE}/products`);
    expect(body).toContain(`${BASE}/coa`);
    expect(body).toContain(`${BASE}/about`);
    expect(body).toContain(`${BASE}/resources`);
    expect(body).toContain(`${BASE}/contact`);
  });
});
