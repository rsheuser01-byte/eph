import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resourcePages } from "@/data/resources";

describe("resource pages link into the catalog", () => {
  it("defines at least one catalog link on every resource page", () => {
    for (const page of resourcePages) {
      expect(
        page.catalogLinks?.length,
        `${page.slug} missing catalogLinks`,
      ).toBeGreaterThan(0);
      expect(page.catalogLinks!.some((link) => link.href === "/products")).toBe(
        true,
      );
    }
  });

  it("renders catalog links in ResourceArticle", () => {
    const article = readFileSync(
      path.join(process.cwd(), "src/components/ResourceArticle.tsx"),
      "utf8",
    );
    expect(article).toMatch(/catalogLinks/);
    expect(article).toMatch(/Catalog/);
  });
});
