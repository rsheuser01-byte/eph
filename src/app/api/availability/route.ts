import { NextResponse } from "next/server";
import { getLiveAvailabilityMap } from "@/lib/inventory/availability";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SKUS = 40;

function parseSkus(raw: string | null): string[] {
  if (!raw?.trim()) {
    return [];
  }
  const seen = new Set<string>();
  const skus: string[] = [];
  for (const part of raw.split(",")) {
    const sku = part.trim();
    if (!sku || seen.has(sku)) {
      continue;
    }
    seen.add(sku);
    skus.push(sku);
    if (skus.length >= MAX_SKUS) {
      break;
    }
  }
  return skus;
}

/** Public live stock read for cart/product add controls (never ISR-cached). */
export async function GET(request: Request) {
  const limited = await checkRateLimit(
    "availability",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.availability,
  );
  if (!limited.allowed) {
    return tooManyRequestsResponse();
  }

  const skus = parseSkus(new URL(request.url).searchParams.get("skus"));
  if (skus.length === 0) {
    return NextResponse.json(
      { success: false, data: null, error: "Provide one or more skus." },
      { status: 400 },
    );
  }

  const data = await getLiveAvailabilityMap(skus);
  return NextResponse.json(
    { success: true, data, error: null },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
