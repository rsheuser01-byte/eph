import { NextResponse } from "next/server";
import { assertAdminApiSession } from "@/lib/admin/auth";
import {
  resendOrderEmail,
  type ResendEmailKind,
} from "@/lib/email/resendOrderEmail";
import { getOrderStore } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: ResendEmailKind[] = [
  "confirmation",
  "shipped",
  "refund",
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

  let body: { kind?: ResendEmailKind } = {};
  try {
    body = (await request.json()) as { kind?: ResendEmailKind };
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (!body.kind || !KINDS.includes(body.kind)) {
    return NextResponse.json({ error: "Invalid email kind." }, { status: 400 });
  }

  const order = await getOrderStore().get(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (body.kind === "confirmation" && order.paymentStatus !== "approved") {
    return NextResponse.json(
      { error: "Confirmation email requires an approved payment." },
      { status: 400 },
    );
  }
  if (
    body.kind === "shipped" &&
    order.fulfillmentStatus !== "shipped" &&
    order.fulfillmentStatus !== "fulfilled"
  ) {
    return NextResponse.json(
      { error: "Ship email requires a shipped or fulfilled order." },
      { status: 400 },
    );
  }
  if (
    body.kind === "refund" &&
    order.paymentStatus !== "refunded" &&
    order.paymentStatus !== "partially_refunded"
  ) {
    return NextResponse.json(
      { error: "Refund email requires a refunded order." },
      { status: 400 },
    );
  }
  if (body.kind === "cancelled" && order.fulfillmentStatus !== "cancelled") {
    return NextResponse.json(
      { error: "Cancel email requires a cancelled fulfillment." },
      { status: 400 },
    );
  }

  try {
    const result = await resendOrderEmail(order, body.kind);
    return NextResponse.json({ ok: true, sent: result.sent });
  } catch (error) {
    console.error("Resend email failed", error);
    return NextResponse.json(
      { error: "Failed to resend email." },
      { status: 500 },
    );
  }
}
