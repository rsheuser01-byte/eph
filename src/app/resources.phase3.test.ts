import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { resourcePages } from "@/data/resources";

describe("Phase 3 #2 FAQ + resources wiring", () => {
  it("emits FAQPage schema from the contact layout", () => {
    const layout = readFileSync(
      path.join(process.cwd(), "src/app/contact/layout.tsx"),
      "utf8",
    );
    expect(layout).toMatch(/faqPageSchema/);
    expect(layout).toMatch(/faqs/);
  });

  it("labels the contact Q&A as a proper FAQ landmark", () => {
    const page = readFileSync(
      path.join(process.cwd(), "src/app/contact/page.tsx"),
      "utf8",
    );
    expect(page).toMatch(/aria-labelledby=["']contact-faq["']/);
    expect(page).toMatch(/id=["']contact-faq["']/);
    expect(page).toMatch(/FaqList/);
    expect(page).toMatch(/\/resources\//);
  });

  it("includes every resource URL in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith("/resources"))).toBe(true);
    for (const page of resourcePages) {
      expect(
        urls.some((url) => url.endsWith(`/resources/${page.slug}`)),
      ).toBe(true);
    }
  });

  it("lists resources in the footer", () => {
    const footer = readFileSync(
      path.join(process.cwd(), "src/components/SiteFooter.tsx"),
      "utf8",
    );
    expect(footer).toMatch(/Resources/);
    expect(footer).toMatch(/\/resources/);
  });
});
