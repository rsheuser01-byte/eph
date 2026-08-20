import { describe, expect, it } from "vitest";
import {
  coaDocuments,
  coaDownloadFiles,
  getCoaForProduct,
  getProductAssaySignals,
  listPublishedCoas,
  productsWithoutPublishedCoa,
} from "./coa";
import { getProductBySlug } from "./products";
import { trustSignals } from "./trustSignals";

describe("coa registry", () => {
  it("maps each published COA to a real catalog product and /coa/*.pdf path", () => {
    expect(coaDocuments.length).toBe(9);
    for (const doc of coaDocuments) {
      expect(getProductBySlug(doc.productSlug)).toBeDefined();
      expect(doc.href).toMatch(/^\/coa\/[a-z0-9-]+\.pdf$/);
      for (const file of doc.additionalFiles ?? []) {
        expect(file.href).toMatch(/^\/coa\/[a-z0-9-]+\.pdf$/);
      }
    }
  });

  it("resolves the uploaded certificates by slug", () => {
    expect(getCoaForProduct("glp-3")?.href).toBe("/coa/glp-3.pdf");
    expect(getCoaForProduct("glp-2")?.href).toBe("/coa/glp-2.pdf");
    expect(getCoaForProduct("nad")?.href).toBe("/coa/nad.pdf");
    expect(getCoaForProduct("glow-blend")?.href).toBe("/coa/glow-blend.pdf");
    expect(getCoaForProduct("klow-blend")?.href).toBe("/coa/klow-blend.pdf");
    expect(getCoaForProduct("tesamorelin")?.href).toBe("/coa/tesamorelin.pdf");
    expect(getCoaForProduct("pt-141")?.href).toBe("/coa/pt-141.pdf");
    expect(getCoaForProduct("mots-c")?.href).toBe("/coa/mots-c.pdf");
    expect(getCoaForProduct("wolverine-blend")?.href).toBe("/coa/bpc-157.pdf");
    expect(getCoaForProduct("mt-2")).toBeUndefined();
    expect(getCoaForProduct("ss-31")).toBeUndefined();
  });

  it("exposes both BPC-157 and TB-500 files for Wolverine Blend", () => {
    const wolverine = getCoaForProduct("wolverine-blend");
    expect(wolverine).toBeDefined();
    expect(coaDownloadFiles(wolverine!)).toEqual([
      { href: "/coa/bpc-157.pdf", label: "BPC-157 COA" },
      { href: "/coa/tb-500.pdf", label: "TB-500 COA" },
    ]);
  });

  it("lists published COAs with product names and leaves the rest for email request", () => {
    const published = listPublishedCoas();
    expect(published.map((doc) => doc.productSlug).sort()).toEqual([
      "glow-blend",
      "glp-2",
      "glp-3",
      "klow-blend",
      "mots-c",
      "nad",
      "pt-141",
      "tesamorelin",
      "wolverine-blend",
    ]);
    expect(productsWithoutPublishedCoa().some((p) => p.slug === "mt-2")).toBe(
      true,
    );
    expect(productsWithoutPublishedCoa().some((p) => p.slug === "ss-31")).toBe(
      true,
    );
  });

  it("records lot purity and issuing lab from each published certificate", () => {
    expect(getCoaForProduct("glp-3")).toMatchObject({
      purity: "99.85%",
      testingLabName: "North South Precision Testing",
      testingLabUrl: "https://www.msds-ghs.cn",
    });
    expect(getCoaForProduct("glp-2")).toMatchObject({
      purity: "99.23%",
      testMethods: "HPLC",
      testingLabName: "SENOBIO",
    });
    expect(getCoaForProduct("nad")).toMatchObject({
      purity: "99.89%",
      testingLabName: "North South Precision Testing",
    });
    expect(getCoaForProduct("glow-blend")).toMatchObject({
      purity: "99.7%",
      testMethods: "FTIR and HPLC",
      testingLabName: "BT Lab Testing",
      testingLabUrl: "https://btlabtesting.com",
    });
    // Janoshik KLOW report verifies composition (mg), not an overall purity %.
    expect(getCoaForProduct("klow-blend")?.purity).toBeUndefined();
    expect(getCoaForProduct("klow-blend")).toMatchObject({
      testingLabName: "Janoshik",
      testingLabUrl: "https://www.janoshik.com",
    });
    expect(getCoaForProduct("tesamorelin")).toMatchObject({
      purity: "99.4%",
      testMethods: "HPLC",
      testingLabName: "SENOBIO",
    });
    expect(getCoaForProduct("pt-141")).toMatchObject({
      purity: "99.4%",
      testMethods: "HPLC",
      testingLabName: "SENOBIO",
    });
    expect(getCoaForProduct("mots-c")).toMatchObject({
      purity: "99.69%",
      testingLabName: "North South Precision Testing",
      testingLabUrl: "https://www.msds-ghs.cn",
    });
    expect(getCoaForProduct("mots-c")?.testMethods).toBeUndefined();
    // Wolverine: two component purities in the note; no single blend purity %.
    expect(getCoaForProduct("wolverine-blend")?.purity).toBeUndefined();
    expect(getCoaForProduct("wolverine-blend")).toMatchObject({
      note: "BPC-157: 99.8% · TB-500: 99.7%",
      testMethods: "FTIR and HPLC",
      testingLabName: "BT Lab Testing",
      testingLabUrl: "https://btlabtesting.com",
    });
  });
});

describe("getProductAssaySignals", () => {
  it("surfaces certificate-backed purity, methods, lab, and PDF for published SKUs", () => {
    expect(getProductAssaySignals("glow-blend")).toEqual({
      purity: "99.7%",
      testMethods: "FTIR and HPLC",
      testingLabName: "BT Lab Testing",
      testingLabUrl: "https://btlabtesting.com",
      coaHref: "/coa/glow-blend.pdf",
      coaNote: null,
      coaFiles: [
        { href: "/coa/glow-blend.pdf", label: "View certificate (PDF)" },
      ],
      hasPublishedCoa: true,
    });
  });

  it("omits invented purity when the certificate only reports composition", () => {
    const signals = getProductAssaySignals("klow-blend");
    expect(signals.hasPublishedCoa).toBe(true);
    expect(signals.purity).toBeNull();
    expect(signals.coaHref).toBe("/coa/klow-blend.pdf");
    expect(signals.testingLabName).toBe("Janoshik");
  });

  it("lists both component PDFs for Wolverine Blend with shared lab/methods", () => {
    const signals = getProductAssaySignals("wolverine-blend");
    expect(signals.hasPublishedCoa).toBe(true);
    expect(signals.purity).toBeNull();
    expect(signals.testMethods).toBe("FTIR and HPLC");
    expect(signals.testingLabName).toBe("BT Lab Testing");
    expect(signals.coaNote).toBe("BPC-157: 99.8% · TB-500: 99.7%");
    expect(signals.coaFiles).toEqual([
      { href: "/coa/bpc-157.pdf", label: "BPC-157 COA" },
      { href: "/coa/tb-500.pdf", label: "TB-500 COA" },
    ]);
  });

  it("falls back to partner + on-request for SKUs without a public PDF", () => {
    const signals = getProductAssaySignals("mt-2");
    expect(signals).toEqual({
      purity: null,
      testMethods: null,
      testingLabName: trustSignals.testingLabName,
      testingLabUrl: trustSignals.testingLabUrl,
      coaHref: null,
      coaNote: null,
      coaFiles: [],
      hasPublishedCoa: false,
    });
  });
});
