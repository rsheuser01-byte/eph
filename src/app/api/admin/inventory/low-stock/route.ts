import { NextResponse } from "next/server";
import { assertAdminApiSession } from "@/lib/admin/auth";
import { sendLowStockAlerts } from "@/lib/inventory/lowStock";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (!(await assertAdminApiSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await sendLowStockAlerts();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Alert failed.",
      },
      { status: 500 },
    );
  }
}
