import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("ProductPurchase default size selection", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/components/ProductPurchase.tsx"),
    "utf8",
  );

  it("defaults the selected size to the first in-stock variant", () => {
    expect(source).toMatch(
      /import \{ defaultInStockSize \} from "@\/lib\/products\/defaultInStockSize"/,
    );
    expect(source).toMatch(
      /useState\(\(\) =>\s*defaultInStockSize\(product\.variants, availability\)/,
    );
  });

  it("shows a product-level research-use notice near the title", () => {
    expect(source).toMatch(/ProductResearchUseNotice/);
  });

  it("uses the catalog display name in the H1 so common names are visible up front", () => {
    expect(source).toMatch(/productDisplayName/);
  });
});
