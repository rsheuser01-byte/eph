import { NextResponse } from "next/server";
import { getOrderStore } from "@/lib/orders";
import { processExpiredReservations } from "@/lib/inventory/expireReservations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

/**
 * Expire abandoned checkout reservations.
 * Protect with CRON_SECRET (Authorization: Bearer …).
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await processExpiredReservations({
    orderStore: getOrderStore(),
  });

  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: Request) {
  return GET(request);
}
