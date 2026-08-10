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

  it("puts Keep shopping in the drawer header as the primary escape hatch", () => {
    expect(drawer).toMatch(/← Keep shopping/);
    expect(drawer).toMatch(/href="\/products"/);
    expect(drawer).toMatch(/onClick=\{closeCart\}/);
    // Visible Close label is gone; backdrop still closes via aria-label.
    expect(drawer).not.toMatch(/>\s*Close\s*</);
    expect(drawer.indexOf("Keep shopping")).toBeLessThan(
      drawer.indexOf("Checkout"),
    );
  });

  it("puts Keep shopping beside the cart page title", () => {
    expect(cartPage).toMatch(/← Keep shopping/);
    expect(cartPage).toMatch(/href="\/products"/);
    expect(cartPage).toMatch(/bg-accent\/15/);
    expect(cartPage.indexOf("Keep shopping")).toBeLessThan(
      cartPage.indexOf("Proceed to checkout"),
    );
  });
});
