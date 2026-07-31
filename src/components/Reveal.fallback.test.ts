import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("reveal progressive enhancement (Phase 2 #7)", () => {
  const css = readFileSync(
    path.join(process.cwd(), "src/app/globals.css"),
    "utf8",
  );
  const layout = readFileSync(
    path.join(process.cwd(), "src/app/layout.tsx"),
    "utf8",
  );

  it("does not hide .reveal by default — only under html.js before visible", () => {
    // Bare .reveal must not start at opacity 0 (no-JS would stay blank).
    expect(css).not.toMatch(/^\.reveal\s*\{[^}]*opacity:\s*0/m);
    expect(css).toMatch(/\.js\s+\.reveal:not\(\.reveal-visible\)/);
    expect(css).toMatch(
      /prefers-reduced-motion:\s*reduce[\s\S]*\.js\s+\.reveal/,
    );
  });

  it("marks the document as JS-capable before interactive paint", () => {
    expect(layout).toMatch(/beforeInteractive/);
    expect(layout).toMatch(/classList\.add\(['"]js['"]\)/);
    expect(layout).toMatch(/<noscript>/);
    // Script adds `js` before hydrate; suppress the expected class mismatch.
    expect(layout).toMatch(/suppressHydrationWarning/);
  });
});
