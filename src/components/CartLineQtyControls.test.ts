import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd(), "src");

describe("cart stock gating", () => {
  it("cart page loads live availability and clamps qty controls", () => {
    const page = readFileSync(join(root, "app/cart/page.tsx"), "utf8");
    const controls = readFileSync(
      join(root, "components/CartLineQtyControls.tsx"),
      "utf8",
    );
    expect(page).toMatch(/useCartAvailability/);
    expect(page).toMatch(/clampToAvailability/);
    expect(page).toMatch(/CartLineQtyControls/);
    expect(controls).toMatch(/purchasableMaxQty/);
    expect(controls).toMatch(/disabled=\{atMax\}/);
  });

  it("cart drawer applies the same stock-aware qty controls", () => {
    const drawer = readFileSync(
      join(root, "components/CartDrawer.tsx"),
      "utf8",
    );
    expect(drawer).toMatch(/useCartAvailability/);
    expect(drawer).toMatch(/CartLineQtyControls/);
    expect(drawer).toMatch(/clampToAvailability/);
  });
});
