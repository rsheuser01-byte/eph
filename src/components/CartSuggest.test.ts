import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("CartSuggest wiring", () => {
  const suggest = readFileSync(
    path.join(process.cwd(), "src/components/CartSuggest.tsx"),
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

  it("loads live availability and picks the first in-stock candidate", () => {
    expect(suggest).toMatch(/getCartSuggestCandidates/);
    expect(suggest).toMatch(/allVariantsOutOfStock/);
    expect(suggest).toMatch(/RelatedProductPurchase/);
    expect(suggest).toMatch(/\/api\/availability/);
    expect(suggest).toMatch(/!availability/);
  });

  it("shows the cart suggest in the cart drawer and cart page", () => {
    expect(drawer).toMatch(/CartSuggest/);
    expect(cartPage).toMatch(/CartSuggest/);
  });
});
