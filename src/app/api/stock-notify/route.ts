import { NextResponse } from "next/server";
import { getEmailProvider } from "@/lib/email";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";
import { buildStockNotifyStoreEmail } from "@/lib/stockNotify/buildNotifyEmail";
import { parseStockNotifyRequest } from "@/lib/stockNotify/parseRequest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Captures a "notify me when back in stock" request and emails the store.
 * Does not invent restock dates — ops follows up when inventory returns.
 */
export async function POST(request: Request) {
  const limited = await checkRateLimit(
    "stockNotify",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.stockNotify,
  );
  if (!limited.allowed) {
    return tooManyRequestsResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = parseStockNotifyRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await getEmailProvider().send(buildStockNotifyStoreEmail(parsed.value));
  } catch (error) {
    console.error("stock-notify email failed", error);
    return NextResponse.json(
      { error: "Could not save your request. Please try again or email support." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    data: { email: parsed.value.email },
    error: null,
  });
}
