import { NextResponse } from "next/server";
import { getOrderStore } from "@/lib/orders";
import { getPaymentEventStore } from "@/lib/payments/paymentEvents";
import { enqueueOrderPaid } from "@/lib/outbox/enqueue";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";
import { logIpnSecurityEvent, processBankfulIpn } from "./processIpn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bankful HPP asynchronous callback (IPN).
 *
 * Requires a valid HMAC-SHA256 signature (gateway password), reconciles
 * amount/currency in integer cents against the stored order, and is idempotent
 * via payment_events. Paid-order emails are enqueued on the durable outbox.
 */
export async function POST(request: Request) {
  const limited = await checkRateLimit(
    "bankfulIpn",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.bankfulIpn,
  );
  if (!limited.allowed) {
    return tooManyRequestsResponse();
  }

  const contentType = request.headers.get("content-type") ?? "";
  let fields: Record<string, string> = {};

  try {
    if (contentType.includes("application/json")) {
      const json = (await request.json()) as Record<string, unknown>;
      fields = Object.fromEntries(
        Object.entries(json).map(([key, value]) => [key, String(value ?? "")]),
      );
    } else {
      const form = await request.formData();
      fields = Object.fromEntries(
        [...form.entries()].map(([key, value]) => [key, String(value)]),
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const result = await processBankfulIpn(fields, {
    getPassword: () => process.env.BANKFUL_PASSWORD?.trim() ?? "",
    orderStore: getOrderStore(),
    paymentEvents: getPaymentEventStore(),
    enqueuePaid: enqueueOrderPaid,
    logSecurityEvent: logIpnSecurityEvent,
  });

  return NextResponse.json(result.body, { status: result.status });
}
