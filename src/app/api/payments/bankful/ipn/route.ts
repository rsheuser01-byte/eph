import { NextResponse } from "next/server";
import { site } from "@/data/site";
import { getEmailProvider } from "@/lib/email";
import {
  buildCustomerConfirmation,
  buildStoreNotification,
} from "@/lib/email/orderConfirmation";
import { getOrderStore } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bankful HPP asynchronous callback (IPN).
 * Idempotent: if the order is already approved, acknowledge without re-emailing.
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

  const orderId =
    fields.xtl_order_id || fields.XTL_ORDER_ID || fields.orderId || "";
  const status = (
    fields.TRANS_STATUS_NAME ||
    fields.trans_status_name ||
    fields.status ||
    ""
  ).toUpperCase();
  const transactionId =
    fields.TRANS_ORDER_ID ||
    fields.TRANS_REQUEST_ID ||
    fields.trans_order_id ||
    "";

  if (!orderId) {
    return NextResponse.json({ error: "Missing order id." }, { status: 400 });
  }

  const store = getOrderStore();
  const existing = await store.get(orderId);
  if (!existing) {
    return NextResponse.json({ error: "Unknown order." }, { status: 404 });
  }

  if (existing.paymentStatus === "approved") {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (status !== "APPROVED") {
    if (store.updateStatus) {
      await store.updateStatus(orderId, { paymentStatus: "declined" });
    }
    return NextResponse.json({ ok: true, approved: false });
  }

  if (store.updateStatus) {
    await store.updateStatus(orderId, {
      paymentStatus: "approved",
      transactionId: transactionId || existing.transactionId,
    });
  }

  try {
    const email = getEmailProvider();
    const emailData = {
      orderId,
      items: existing.items,
      subtotal: existing.subtotal,
      shipping: existing.shipping,
      total: existing.total,
      customer: existing.customer,
      siteName: site.name,
    };
    await email.send(buildCustomerConfirmation(emailData));
    await email.send(buildStoreNotification(emailData, site.email));
  } catch (error) {
    console.error(`IPN email failed for ${orderId}:`, error);
  }

  return NextResponse.json({ ok: true, approved: true });
}
