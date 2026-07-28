import { NextResponse } from "next/server";
import { assertAdminApiSession } from "@/lib/admin/auth";
import { adjustStock, stockItemsFromOrder } from "@/lib/inventory";
import { enqueueOrderRefunded } from "@/lib/outbox/enqueue";
import { getOrderStore } from "@/lib/orders";
import { getPaymentProvider } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  if (!(await assertAdminApiSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { orderId } = await context.params;

  let body: { amount?: number; restock?: boolean } = {};
  try {
    body = (await request.json()) as { amount?: number; restock?: boolean };
  } catch {
    // full refund default
  }

  const store = getOrderStore();
  const order = await store.get(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (!order.transactionId) {
    return NextResponse.json(
      { error: "Order has no payment transaction id." },
      { status: 400 },
    );
  }
  if (
    order.paymentStatus !== "approved" &&
    order.paymentStatus !== "partially_refunded"
  ) {
    return NextResponse.json(
      { error: `Cannot refund order in status ${order.paymentStatus}.` },
      { status: 400 },
    );
  }

  const remaining = Math.max(0, order.total - order.refundedAmount);
  const amount =
    typeof body.amount === "number" && body.amount > 0
      ? Math.min(body.amount, remaining)
      : remaining;

  if (amount <= 0) {
    return NextResponse.json({ error: "Nothing left to refund." }, { status: 400 });
  }

  const provider = getPaymentProvider();
  if (!provider.refund) {
    return NextResponse.json(
      { error: "Current payment provider does not support refunds." },
      { status: 501 },
    );
  }

  const outcome = await provider.refund({
    orderId: order.orderId,
    transactionId: order.transactionId,
    amount,
    currency: order.currency,
  });

  if (!outcome.ok) {
    return NextResponse.json(
      { error: outcome.message ?? "Refund failed." },
      { status: 402 },
    );
  }

  const refundedAmount = order.refundedAmount + amount;
  const paymentStatus =
    refundedAmount >= order.total - 0.001 ? "refunded" : "partially_refunded";

  if (store.updateStatus) {
    await store.updateStatus(orderId, { paymentStatus, refundedAmount });
  }

  const shouldRestock =
    body.restock ??
    (paymentStatus === "refunded" &&
      (order.fulfillmentStatus === "unfulfilled" ||
        order.fulfillmentStatus === "processing" ||
        order.fulfillmentStatus === "cancelled"));
  if (shouldRestock) {
    for (const item of stockItemsFromOrder(order.items)) {
      await adjustStock(item.sku, item.qty, "refund_restock", {
        orderId,
        actor: "admin",
      }).catch((error) => {
        console.error(`Restock failed for ${item.sku}:`, error);
      });
    }
  }

  await enqueueOrderRefunded(
    orderId,
    amount,
    refundedAmount,
    paymentStatus === "partially_refunded",
  ).catch((error) => {
    console.error("Failed to enqueue order.refunded", error);
  });

  return NextResponse.json({
    ok: true,
    paymentStatus,
    refundedAmount,
    restocked: shouldRestock,
  });
}
