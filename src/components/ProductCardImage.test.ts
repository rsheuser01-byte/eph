import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("ProductCardImage progressive fade", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/components/ProductCardImage.tsx"),
    "utf8",
  );

  it("is a client component that fades in after load", () => {
    expect(source).toMatch(/"use client"/);
    expect(source).toMatch(/onLoad/);
    expect(source).toMatch(/opacity-0/);
    expect(source).toMatch(/opacity-100/);
  });

  it("accepts a fade delay for phased reveals", () => {
    expect(source).toMatch(/fadeDelayMs/);
  });

  it("can eager-load below-fold catalog images", () => {
    expect(source).toMatch(/eager/);
    expect(source).toMatch(
      /loading=\{priority \? undefined : eager \? "eager" : "lazy"\}/,
    );
  });

  it("respects prefers-reduced-motion", () => {
    expect(source).toMatch(/prefers-reduced-motion/);
  });

  it("serves packshots unoptimized so vial label type is not crushed by the image optimizer", () => {
    expect(source).toMatch(/unoptimized/);
    expect(source).not.toMatch(/quality=\{75\}/);
  });
});
