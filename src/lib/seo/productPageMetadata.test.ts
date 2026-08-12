import { describe, expect, it } from "vitest";
import { getProductAssaySignals } from "@/data/coa";
import { products } from "@/data/products";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import {
  productMetaDescription,
  productPageMetadata,
  productPageTitle,
  productPageTitleKind,
} from "@/lib/seo/productPageMetadata";

describe("productPageTitle", () => {
  it("builds a unique absolute title for every catalog SKU", () => {
    const titles = products.map((product) => productPageTitle(product));
    expect(new Set(titles).size).toBe(products.length);
    for (const product of products) {
      const title = productPageTitle(product);
      expect(title).toContain(product.name);
      expect(title).toContain(site.name);
      expect(title).toContain(productPageTitleKind(product));
      expect(title).not.toMatch(/\s{2,}/);
    }
  });

  it("uses natural category wording", () => {
    expect(productPageTitleKind(products.find((p) => p.slug === "glp-3")!)).toBe(
      "Research Peptide",
    );
    expect(productPageTitleKind(products.find((p) => p.slug === "nad")!)).toBe(
      "Research Cofactor",
    );
    expect(
      productPageTitleKind(products.find((p) => p.slug === "glow-blend")!),
    ).toBe("Research Blend");
  });
});

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
      expect(description).not.toMatch(/\bundefined\b/i);
      expect(description).not.toMatch(/\s{2,}/);
      expect(description).not.toMatch(/\.\./);
      expect(description).not.toMatch(/,\s*,/);
    }
  });

  it("leads with research interest and includes size/price plus COA purity when published", () => {
    const glp3 = products.find((product) => product.slug === "glp-3")!;
    const description = productMetaDescription(glp3);
    expect(description.startsWith(glp3.shortDescription)).toBe(true);
    expect(description).toMatch(/\$79\.99/);
    expect(description).toMatch(/10mg/);
    expect(description).toContain(getProductAssaySignals("glp-3").purity!);

    const mt2 = products.find((product) => product.slug === "mt-2")!;
    const mt2Description = productMetaDescription(mt2);
    expect(mt2Description.startsWith(mt2.shortDescription)).toBe(true);
    expect(mt2Description).toMatch(/\$44\.99/);
    expect(mt2Description).not.toMatch(/\d+\.\d+%/); // no invented purity
  });
});

describe("productPageMetadata", () => {
  it("wires absolute title, description, and packshot into pageMetadata", () => {
    const glp3 = products.find((product) => product.slug === "glp-3")!;
    const meta = productPageMetadata(glp3);
    expect(meta.title).toEqual({ absolute: productPageTitle(glp3) });
    expect(meta.description).toBe(productMetaDescription(glp3));
    expect(meta.alternates?.canonical).toBe("/products/glp-3");
    expect(meta.openGraph?.description).toBe(meta.description);
    expect(meta.twitter?.description).toBe(meta.description);
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
