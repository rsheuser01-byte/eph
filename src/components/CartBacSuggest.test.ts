import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("CartBacSuggest wiring", () => {
  const suggest = readFileSync(
    path.join(process.cwd(), "src/components/CartBacSuggest.tsx"),
    "utf8",
  );
  const drawer = readFileSync(
    path.join(process.cwd(), "src/components/CartDrawer.tsx"),
    "utf8",
  );
  const cartPage = readFileSync(
    path.join(process.cwd(), "src/app/cart/page.tsx"),
    "utf8",
  );
  const purchase = readFileSync(
    path.join(process.cwd(), "src/components/RelatedProductPurchase.tsx"),
    "utf8",
  );

  it("renders a larger BAC photo and loads live availability before add", () => {
    expect(suggest).toMatch(/"use client"/);
    expect(suggest).toMatch(/shouldSuggestBac/);
    expect(suggest).toMatch(/from "next\/image"/);
    expect(suggest).toMatch(/\/api\/availability/);
    expect(suggest).toMatch(/allVariantsOutOfStock/);
    expect(suggest).toMatch(/RelatedProductPurchase/);
    expect(suggest).toMatch(/w-32|w-36|w-40/);
    expect(suggest).toMatch(/bac/);
    // Stay hidden until stock is known (no OOS flash / no stale add).
    expect(suggest).toMatch(/!availability \|\| allVariantsOutOfStock/);
    expect(suggest).toMatch(/setAvailability\(null\)/);
    expect(suggest).not.toMatch(/Checking stock/);
  });

  it("shows the BAC suggest in the cart drawer and cart page when applicable", () => {
    expect(drawer).toMatch(/CartBacSuggest/);
    expect(cartPage).toMatch(/CartBacSuggest/);
  });

  it("disables add when the selected size is out of stock", () => {
    expect(purchase).toMatch(/canAdd = Boolean\(variant\) && inStock/);
    expect(purchase).toMatch(/disabled=\{!canAdd\}/);
    expect(purchase).toMatch(/Out of stock/);
  });
});
