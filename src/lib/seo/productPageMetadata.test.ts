import { describe, expect, it } from "vitest";
import { getProductAssaySignals } from "@/data/coa";
import { products } from "@/data/products";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { productMetaDescription } from "@/lib/seo/productPageMetadata";

describe("productMetaDescription", () => {
  it("writes a unique description for every catalog SKU", () => {
    const descriptions = products.map((product) =>
      productMetaDescription(product),
    );
    expect(new Set(descriptions).size).toBe(products.length);
  });

  it("does not use the old name-swap template", () => {
    for (const product of products) {
      const description = productMetaDescription(product);
      expect(description).not.toMatch(
        new RegExp(
          `^${product.name} \\(${product.sku}\\), a research-use-only`,
        ),
      );
      expect(description.length).toBeGreaterThan(80);
      expect(description.length).toBeLessThanOrEqual(320);
      expect(description).toMatch(/Research use only/i);
    }
  });

  it("includes price and vial size context plus COA purity when published", () => {
    const glp3 = products.find((product) => product.slug === "glp-3")!;
    const description = productMetaDescription(glp3);
    expect(description).toContain(glp3.shortDescription);
    expect(description).toMatch(/\$79\.99/);
    expect(description).toMatch(/10mg/);
    expect(description).toContain(getProductAssaySignals("glp-3").purity!);

    const mt2 = products.find((product) => product.slug === "mt-2")!;
    const mt2Description = productMetaDescription(mt2);
    expect(mt2Description).toContain(mt2.shortDescription);
    expect(mt2Description).toMatch(/\$44\.99/);
    expect(mt2Description).not.toMatch(/\d+\.\d+%/); // no invented purity
  });
});

describe("product page social image via pageMetadata", () => {
  it("accepts a per-page OG/Twitter image override", () => {
    const meta = pageMetadata({
      title: "GLP-3 — Research Peptide",
      description: "Unique copy",
      path: "/products/glp-3",
      image: {
        url: "/products/glp-3-10mg.png",
        width: 1024,
        height: 1024,
        alt: "GLP-3 research vial",
      },
    });

    expect(meta.openGraph?.images).toEqual([
      {
        url: "/products/glp-3-10mg.png",
        width: 1024,
        height: 1024,
        alt: "GLP-3 research vial",
      },
    ]);
    expect(meta.twitter?.images).toEqual(["/products/glp-3-10mg.png"]);
  });
});
