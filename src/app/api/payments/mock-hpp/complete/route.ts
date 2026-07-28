import { NextResponse } from "next/server";
import { site } from "@/data/site";
import { getEmailProvider } from "@/lib/email";
import {
  buildCustomerConfirmation,
  buildStoreNotification,
} from "@/lib/email/orderConfirmation";
import { commitReservations } from "@/lib/inventory/reservations";
import { getOrderStore } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dev-only helper for mock-hpp checkout completion. */
export async function GET(request: Request) {
  if ((process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase() !== "mock-hpp") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get("order") ?? "";
  if (!orderId) {
    return NextResponse.redirect(new URL("/checkout?error=missing_order", url.origin));
  }

  const store = getOrderStore();
  const existing = await store.get(orderId);
  if (!existing) {
    return NextResponse.redirect(new URL("/checkout?error=unknown_order", url.origin));
  }

  if (existing.paymentStatus !== "approved" && store.updateStatus) {
    try {
      await commitReservations(orderId);
    } catch (error) {
      console.error(`Mock HPP commit reservation failed for ${orderId}:`, error);
      return NextResponse.redirect(
        new URL("/checkout?error=inventory_commit_failed", url.origin),
      );
    }

    await store.updateStatus(orderId, {
      paymentStatus: "approved",
      transactionId: `mock_hpp_${Date.now()}`,
    });

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
      console.error(`Mock HPP email failed for ${orderId}:`, error);
    }
  }

  return NextResponse.redirect(
    new URL(`/checkout/success?order=${encodeURIComponent(orderId)}`, url.origin),
  );
}
