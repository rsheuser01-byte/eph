import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness probe — process is up. No dependency checks. */
export async function GET() {
  return NextResponse.json({ ok: true, status: "ok" });
}
