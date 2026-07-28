import { NextResponse } from "next/server";
import { assertAdminApiSession } from "@/lib/admin/auth";
import { getOrderStore } from "@/lib/orders";
import type { FulfillmentStatus } from "@/lib/orders";

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

  let body: { fulfillmentStatus?: FulfillmentStatus } = {};
  try {
    body = (await request.json()) as { fulfillmentStatus?: FulfillmentStatus };
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const nextStatus = body.fulfillmentStatus;
  if (
    nextStatus !== "fulfilled" &&
    nextStatus !== "unfulfilled" &&
    nextStatus !== "cancelled"
  ) {
    return NextResponse.json(
      { error: "Invalid fulfillment status." },
      { status: 400 },
    );
  }

  const store = getOrderStore();
  if (!store.updateStatus) {
    return NextResponse.json(
      { error: "Order store cannot update status." },
      { status: 501 },
    );
  }

  const updated = await store.updateStatus(orderId, {
    fulfillmentStatus: nextStatus,
  });
  if (!updated) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    fulfillmentStatus: updated.fulfillmentStatus,
  });
}
