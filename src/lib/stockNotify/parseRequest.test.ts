import { describe, expect, it } from "vitest";
import { parseStockNotifyRequest } from "./parseRequest";

describe("parseStockNotifyRequest", () => {
  it("accepts a valid restock notify payload", () => {
    const result = parseStockNotifyRequest({
      email: "lab@example.com",
      productSlug: "glp-3",
      sku: "GLP-3-10MG",
      size: "10mg",
    });
    expect(result).toEqual({
      ok: true,
      value: {
        email: "lab@example.com",
        productSlug: "glp-3",
        sku: "GLP-3-10MG",
        size: "10mg",
      },
    });
  });

  it("rejects missing or invalid email", () => {
    expect(parseStockNotifyRequest({ email: "", productSlug: "mt-2", sku: "MT2-10MG", size: "10mg" }).ok).toBe(false);
    expect(
      parseStockNotifyRequest({
        email: "not-an-email",
        productSlug: "mt-2",
        sku: "MT2-10MG",
        size: "10mg",
      }).ok,
    ).toBe(false);
  });

  it("rejects unknown product or SKU that is not on that product", () => {
    expect(
      parseStockNotifyRequest({
        email: "lab@example.com",
        productSlug: "nope",
        sku: "GLP-3-10MG",
        size: "10mg",
      }).ok,
    ).toBe(false);
    expect(
      parseStockNotifyRequest({
        email: "lab@example.com",
        productSlug: "glp-3",
        sku: "MT2-10MG",
        size: "10mg",
      }).ok,
    ).toBe(false);
  });

  it("rejects size that does not match the SKU variant", () => {
    expect(
      parseStockNotifyRequest({
        email: "lab@example.com",
        productSlug: "glp-3",
        sku: "GLP-3-10MG",
        size: "60mg",
      }).ok,
    ).toBe(false);
  });
});
