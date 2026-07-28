import { NextResponse } from "next/server";
import { assertAdminApiSession } from "@/lib/admin/auth";
import {
  adjustStock,
  seedInventoryFromCatalog,
  type StockMovementReason,
} from "@/lib/inventory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await assertAdminApiSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: {
    sku?: string;
    delta?: number;
    reason?: StockMovementReason;
    seed?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (body.seed) {
    const count = await seedInventoryFromCatalog(0);
    return NextResponse.json({ ok: true, seeded: count });
  }

  const sku = body.sku?.trim() ?? "";
  const delta = body.delta;
  const reason = body.reason;
  if (!sku || typeof delta !== "number" || !Number.isFinite(delta) || !reason) {
    return NextResponse.json(
      { error: "sku, delta, and reason are required." },
      { status: 400 },
    );
  }
  if (reason !== "manual_adjust" && reason !== "receive") {
    return NextResponse.json(
      { error: "reason must be manual_adjust or receive." },
      { status: 400 },
    );
  }

  try {
    const quantityOnHand = await adjustStock(sku, delta, reason, {
      actor: "admin",
    });
    return NextResponse.json({ ok: true, sku, quantityOnHand });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Adjustment failed.",
      },
      { status: 400 },
    );
  }
}
