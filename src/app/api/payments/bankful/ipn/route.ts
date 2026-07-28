import { NextResponse } from "next/server";
import { getEmailProvider } from "@/lib/email";
import { getOrderStore } from "@/lib/orders";
import { getPaymentEventStore } from "@/lib/payments/paymentEvents";
import {
  defaultSendIpnEmails,
  logIpnSecurityEvent,
  processBankfulIpn,
} from "./processIpn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bankful HPP asynchronous callback (IPN).
 *
 * Requires a valid HMAC-SHA256 signature (gateway password), reconciles
 * amount/currency in integer cents, and is idempotent via payment_events.
 */
export async function POST(request: Request) {
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

  const orderStore = getOrderStore();
  const email = getEmailProvider();

  const result = await processBankfulIpn(fields, {
    getPassword: () => process.env.BANKFUL_PASSWORD?.trim() ?? "",
    orderStore,
    paymentEvents: getPaymentEventStore(),
    sendEmails: (orderId) =>
      defaultSendIpnEmails(orderId, orderStore, (message) =>
        email.send(message),
      ),
    logSecurityEvent: logIpnSecurityEvent,
  });

  return NextResponse.json(result.body, { status: result.status });
}
