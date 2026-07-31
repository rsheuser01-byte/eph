import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile header tap targets (Phase 2 #8)", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/components/SiteHeader.tsx"),
    "utf8",
  );

  it("gives Cart and Menu buttons a ≥44px min hit area", () => {
    // Tailwind min-h-11 / min-w-11 = 2.75rem = 44px
    expect(source).toMatch(/CartButton[\s\S]*min-h-11/);
    expect(source).toMatch(/Close[\s\S]*Menu|Menu[\s\S]*min-h-11/);
    expect(source).toMatch(
      /aria-controls="mobile-nav"[\s\S]*?min-h-11/,
    );
    expect(source).toMatch(
      /aria-label=\{`Open cart[\s\S]*?min-h-11/,
    );
  });
});
