import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Keep shopping cart escape hatch", () => {
  const drawer = readFileSync(
    path.join(process.cwd(), "src/components/CartDrawer.tsx"),
    "utf8",
  );
  const cartPage = readFileSync(
    path.join(process.cwd(), "src/app/cart/page.tsx"),
    "utf8",
  );

  it("links to the catalog from the filled cart drawer", () => {
    expect(drawer).toMatch(/Keep shopping/);
    expect(drawer).toMatch(/href="\/products"/);
    // Filled-state link should close the drawer when continuing.
    expect(drawer).toMatch(/Keep shopping[\s\S]*onClick=\{closeCart\}|onClick=\{closeCart\}[\s\S]*Keep shopping/);
  });

  it("links to the catalog from the cart page summary", () => {
    expect(cartPage).toMatch(/Keep shopping/);
    expect(cartPage).toMatch(/href="\/products"/);
  });
});
