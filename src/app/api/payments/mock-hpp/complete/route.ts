import { NextResponse } from "next/server";
import { commitReservations } from "@/lib/inventory/reservations";
import { enqueueOrderPaid } from "@/lib/outbox/enqueue";
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
  const token = url.searchParams.get("token") ?? "";
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
      await enqueueOrderPaid(orderId);
    } catch (error) {
      console.error(`Mock HPP outbox enqueue failed for ${orderId}:`, error);
    }
  }

  const params = new URLSearchParams({ order: orderId });
  const lookup = token || existing.lookupToken || "";
  if (lookup) {
    params.set("token", lookup);
  }
  return NextResponse.redirect(
    new URL(`/checkout/success?${params.toString()}`, url.origin),
  );
}
