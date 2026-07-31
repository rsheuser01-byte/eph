import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("testimonials wiring (Phase 3 #4)", () => {
  it("surfaces the testimonials section on the homepage", () => {
    const page = readFileSync(
      path.join(process.cwd(), "src/app/page.tsx"),
      "utf8",
    );
    expect(page).toMatch(/TestimonialsSection/);
  });

  it("gates Organization review JSON-LD in the root layout", () => {
    const layout = readFileSync(
      path.join(process.cwd(), "src/app/layout.tsx"),
      "utf8",
    );
    expect(layout).toMatch(/organizationReviewSchema|canEmitReviewSchema/);
  });

  it("keeps the invite path pointed at contact feedback", () => {
    const component = readFileSync(
      path.join(process.cwd(), "src/components/TestimonialsSection.tsx"),
      "utf8",
    );
    expect(component).toMatch(/\/contact/);
    expect(component).toMatch(/publishedTestimonials|testimonials/);
  });
});
