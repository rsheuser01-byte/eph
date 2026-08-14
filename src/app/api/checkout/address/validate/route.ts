import { NextResponse } from "next/server";
import {
  AddressVerificationError,
  verifyShippingAddress,
} from "@/lib/address/google";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const limited = await checkRateLimit(
    "addressValidate",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.addressValidate,
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

  try {
    const result = await verifyShippingAddress({
      address1: str(body.address1) || str(body.query),
      address2: str(body.address2) || undefined,
      city: str(body.city),
      state: str(body.state),
      zip: str(body.zip),
      country: str(body.country) || "US",
    });
    if (!result.ok) {
      return NextResponse.json(result);
    }
    if (!result.enabled) {
      return NextResponse.json({
        ok: true,
        enabled: false,
      });
    }
    return NextResponse.json({
      ok: true,
      enabled: true,
      formatted: result.formatted,
      address: result.billing,
    });
  } catch (error) {
    if (error instanceof AddressVerificationError) {
      return NextResponse.json(
        { error: "Unable to verify this address. Please try again." },
        { status: 503 },
      );
    }
    throw error;
  }
}
