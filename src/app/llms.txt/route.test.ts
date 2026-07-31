import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/llms.txt/route";
import { buildLlmsTxt } from "@/lib/seo/llmsTxt";
import { getSiteUrl } from "@/lib/seo/siteUrl";

describe("llms.txt route (Phase 3 #6)", () => {
  it("is registered as an App Router text route", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/app/llms.txt/route.ts"),
      "utf8",
    );
    expect(source).toMatch(/export async function GET/);
    expect(source).toMatch(/buildLlmsTxt/);
    expect(source).toMatch(/text\/plain/);
  });

  it("returns plain text built from the live catalog", async () => {
    const response = await GET();
    const text = await response.text();
    expect(response.headers.get("content-type")).toMatch(/text\/plain/);
    expect(text).toBe(buildLlmsTxt(getSiteUrl()));
  });
});
