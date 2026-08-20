import { expect, test } from "@playwright/test";

/**
 * Smoke E2E: browse → cart → checkout → mock HPP approve → success.
 * Runs without Bankful/TaxJar/Supabase (mock-hpp + mock tax + file store).
 */
test.describe("checkout mock-hpp happy path", () => {
  test("browse, add to cart, checkout, and land on approved success", async ({
    page,
  }) => {
    // AgeGate opens in useEffect after hydration — a one-shot isVisible() races and
    // leaves the dialog blocking clicks. Seed session flags before any navigation.
    await page.addInitScript(() => {
      window.sessionStorage.setItem("eph-age-verified", "true");
      window.sessionStorage.setItem("eph-newsletter-dismissed", "true");
    });

    await page.goto("/products/glp-3");

    // Exact H1 — Phase 3 added several other headings that also contain "GLP-3".
    await expect(
      page.getByRole("heading", { level: 1, name: "GLP-3 (Retatrutide)", exact: true }),
    ).toBeVisible();
    // Primary CTA uses btn-arrow (accessible name "Add to cart →"); related products also expose "Add to cart".
    await page.getByRole("button", { name: "Add to cart →" }).click();

    await page.goto("/cart");
    await expect(page.getByText(/GLP-3/i).first()).toBeVisible();
    await page.getByRole("button", { name: "Increase quantity" }).click();

    await page.goto("/checkout");
    await expect(
      page.getByRole("heading", { name: /Complete your order/i }),
    ).toBeVisible();

    await page.getByPlaceholder("First name").fill("Ada");
    await page.getByPlaceholder("Last name").fill("Lovelace");
    await page.getByPlaceholder("Email").fill("ada@example.com");
    await page.getByPlaceholder("Address", { exact: true }).fill("1 Lab St");
    await page.getByPlaceholder("City").fill("Louisville");
    await page.getByPlaceholder("State").fill("KY");
    await page.getByPlaceholder("ZIP code").fill("40202");

    await expect(page.getByText("Tax", { exact: true })).toBeVisible();

    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", { name: /Continue to secure payment/i })
      .click();

    await page.waitForURL(/\/checkout\/success/, { timeout: 60_000 });
    await expect(
      page.getByRole("heading", { name: /Payment confirmed|Order/i }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/token=/);
  });
});
