import { NextResponse } from "next/server";
import {
  assessProductionConfig,
  isProductionRuntime,
} from "@/lib/config/productionReadiness";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckResult = {
  name: string;
  ok: boolean;
  detail?: string;
};

function authorizedForDetails(request: Request): boolean {
  const secret =
    process.env.READINESS_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "";
  if (!secret) {
    return false;
  }
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

async function runChecks(): Promise<{ ready: boolean; checks: CheckResult[] }> {
  const checks: CheckResult[] = [];

  const config = assessProductionConfig({
    forceProduction: isProductionRuntime(),
  });
  const configOk =
    !isProductionRuntime() ||
    config.issues.filter((i) => i.severity === "error").length === 0;
  checks.push({
    name: "payment_config",
    ok: configOk,
    detail: configOk
      ? "ok"
      : config.issues
          .filter((i) => i.severity === "error")
          .map((i) => i.key)
          .join(","),
  });

  const emailProvider = (process.env.EMAIL_PROVIDER ?? "console").toLowerCase();
  const emailOk = isProductionRuntime()
    ? emailProvider === "resend" && Boolean(process.env.RESEND_API_KEY?.trim())
    : true;
  checks.push({
    name: "email_config",
    ok: emailOk,
    detail: emailOk ? emailProvider : "missing_resend",
  });

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );

  if (!supabaseConfigured) {
    checks.push({
      name: "supabase",
      ok: !isProductionRuntime(),
      detail: "not_configured",
    });
  } else {
    try {
      const client = getSupabaseAdmin();
      const orders = await client.from("orders").select("id").limit(1);
      checks.push({
        name: "orders_table",
        ok: !orders.error,
        detail: orders.error?.message ?? "ok",
      });

      const inventory = await client.from("inventory").select("sku").limit(1);
      checks.push({
        name: "inventory_table",
        ok: !inventory.error,
        detail: inventory.error?.message ?? "ok",
      });

      const rpc = await client.rpc("inventory_available_qty", {
        p_sku: "__readiness_probe__",
      });
      // Missing SKU still returns 0 from the function; only transport/SQL errors fail.
      checks.push({
        name: "inventory_rpc",
        ok: !rpc.error,
        detail: rpc.error?.message ?? "ok",
      });

      const reservations = await client
        .from("inventory_reservations")
        .select("id")
        .limit(1);
      checks.push({
        name: "inventory_reservations_table",
        ok: !reservations.error,
        detail: reservations.error?.message ?? "ok",
      });

      const outbox = await client.from("outbox_events").select("id").limit(1);
      checks.push({
        name: "outbox_events_table",
        ok: !outbox.error,
        detail: outbox.error?.message ?? "ok",
      });
    } catch (error) {
      checks.push({
        name: "supabase",
        ok: false,
        detail: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  const ready = checks.every((check) => check.ok);
  return { ready, checks };
}

/**
 * Readiness probe.
 * Public response is minimal `{ ready }`.
 * Detailed checks require Authorization: Bearer READINESS_SECRET|CRON_SECRET.
 */
export async function GET(request: Request) {
  const { ready, checks } = await runChecks();
  const showDetails = authorizedForDetails(request);

  if (!showDetails) {
    return NextResponse.json(
      { ready },
      { status: ready ? 200 : 503 },
    );
  }

  return NextResponse.json(
    {
      ready,
      production: isProductionRuntime(),
      checks,
    },
    { status: ready ? 200 : 503 },
  );
}
