import { buildLlmsTxt } from "@/lib/seo/llmsTxt";
import { getSiteUrl } from "@/lib/seo/siteUrl";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const body = buildLlmsTxt(getSiteUrl());

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
