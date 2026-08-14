import { NextResponse } from "next/server";
import {
  AddressVerificationError,
  suggestAddresses,
} from "@/lib/address/google";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await checkRateLimit(
    "addressSuggest",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.addressSuggest,
  );
  if (!limited.allowed) {
    return tooManyRequestsResponse();
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query : "";

  try {
    const result = await suggestAddresses(query);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AddressVerificationError) {
      return NextResponse.json(
        { error: "Unable to look up addresses. Please try again." },
        { status: 503 },
      );
    }
    throw error;
  }
}
