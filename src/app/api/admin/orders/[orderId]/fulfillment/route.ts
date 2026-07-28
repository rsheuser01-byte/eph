import { NextResponse } from "next/server";
import { assertAdminApiSession } from "@/lib/admin/auth";
import {
  enqueueOrderCancelled,
  enqueueOrderShipped,
} from "@/lib/outbox/enqueue";
import { getOrderStore } from "@/lib/orders";
import type { FulfillmentStatus } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FulfillmentBody = {
  fulfillmentStatus?: FulfillmentStatus;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  fulfillmentNotes?: string;
};

const ALLOWED: FulfillmentStatus[] = [
  "unfulfilled",
  "processing",
  "shipped",
  "fulfilled",
  "cancelled",
];

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  if (!(await assertAdminApiSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { orderId } = await context.params;

  let body: FulfillmentBody = {};
  try {
    body = (await request.json()) as FulfillmentBody;
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const nextStatus = body.fulfillmentStatus;
  if (!nextStatus || !ALLOWED.includes(nextStatus)) {
    return NextResponse.json(
      { error: "Invalid fulfillment status." },
      { status: 400 },
    );
  }

  if (nextStatus === "shipped") {
    const tracking = body.trackingNumber?.trim() ?? "";
    if (!tracking) {
      return NextResponse.json(
        { error: "Tracking number is required to mark shipped." },
        { status: 400 },
      );
    }
    const url = body.trackingUrl?.trim();
    if (url) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
          return NextResponse.json(
            { error: "Tracking URL must be http or https." },
            { status: 400 },
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Tracking URL is invalid." },
          { status: 400 },
        );
      }
    }
  }

  const store = getOrderStore();
  if (!store.updateStatus) {
    return NextResponse.json(
      { error: "Order store cannot update status." },
      { status: 501 },
    );
  }

  const existing = await store.get(orderId);
  if (!existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (
    nextStatus === "shipped" ||
    nextStatus === "fulfilled" ||
    nextStatus === "processing"
  ) {
    if (existing.paymentStatus !== "approved") {
      return NextResponse.json(
        { error: "Only approved orders can be fulfilled or shipped." },
        { status: 400 },
      );
    }
  }

  const now = new Date().toISOString();
  const updated = await store.updateStatus(orderId, {
    fulfillmentStatus: nextStatus,
    carrier: body.carrier?.trim() || undefined,
    trackingNumber: body.trackingNumber?.trim() || undefined,
    trackingUrl: body.trackingUrl?.trim() || undefined,
    fulfillmentNotes: body.fulfillmentNotes?.trim() || undefined,
    shippedAt:
      nextStatus === "shipped" ? (existing.shippedAt ?? now) : undefined,
    fulfilledAt:
      nextStatus === "fulfilled" || nextStatus === "shipped"
        ? (existing.fulfilledAt ?? now)
        : undefined,
  });
  if (!updated) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (nextStatus === "shipped") {
    await enqueueOrderShipped(orderId).catch((error) => {
      console.error("Failed to enqueue order.shipped", error);
    });
  }
  if (nextStatus === "cancelled") {
    await enqueueOrderCancelled(orderId).catch((error) => {
      console.error("Failed to enqueue order.cancelled", error);
    });
  }

  return NextResponse.json({
    ok: true,
    fulfillmentStatus: updated.fulfillmentStatus,
    carrier: updated.carrier ?? null,
    trackingNumber: updated.trackingNumber ?? null,
    trackingUrl: updated.trackingUrl ?? null,
    shippedAt: updated.shippedAt ?? null,
    fulfilledAt: updated.fulfilledAt ?? null,
  });
}
