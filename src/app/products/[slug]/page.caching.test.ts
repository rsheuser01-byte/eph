import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PRODUCT_PAGE_REVALIDATE_SECONDS } from "@/lib/inventory/productPageCache";

describe("product detail page caching", () => {
  const pageSource = readFileSync(
    path.join(process.cwd(), "src/app/products/[slug]/page.tsx"),
    "utf8",
  );

  it("shares a 300s ISR window with the availability cache helper", () => {
    expect(PRODUCT_PAGE_REVALIDATE_SECONDS).toBe(300);
  });

  it("uses ISR revalidation instead of force-dynamic no-store", () => {
    expect(pageSource).toMatch(
      new RegExp(
        `export const revalidate = ${PRODUCT_PAGE_REVALIDATE_SECONDS}\\b`,
      ),
    );
    expect(pageSource).not.toMatch(/force-dynamic/);
  });

  it("keeps generateStaticParams so known SKUs prerender", () => {
    expect(pageSource).toMatch(/export async function generateStaticParams/);
  });
});
