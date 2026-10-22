import { NextResponse } from "next/server";
import { assertAdminApiSession } from "@/lib/admin/auth";
import { getPromoStore } from "@/lib/promo";
import {
  parsePromoActiveChange,
  parsePromoSave,
} from "@/lib/promo/parsePromoSave";
import { writeAuditLog } from "@/lib/security/audit";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await assertAdminApiSession())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const limited = await checkRateLimit(
    "adminPromos",
    `ip:${clientIpFromRequest(request)}`,
    RATE_LIMITS.adminPromos,
  );
  if (!limited.allowed) {
    return tooManyRequestsResponse();
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const store = getPromoStore();

  try {
    if (body.action === "set-active") {
      const parsed = parsePromoActiveChange(body);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      const existing = await store.getByCode(parsed.code);
      if (!existing) {
        return NextResponse.json({ error: "Unknown promo code." }, { status: 404 });
      }
      const promo = { ...existing, active: parsed.active };
      await store.upsert(promo);
      await writeAuditLog(
        {
          actor: "admin",
          action: parsed.active ? "promo.reactivate" : "promo.cancel",
          entityType: "promo_code",
          entityId: promo.code,
        },
        request,
      );
      return NextResponse.json({ ok: true, promo });
    }

    const parsed = parsePromoSave(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    await store.upsert(parsed.promo);
    await writeAuditLog(
      {
        actor: "admin",
        action: "promo.save",
        entityType: "promo_code",
        entityId: parsed.promo.code,
        metadata: {
          percentOff: parsed.promo.percentOff ?? null,
          amountOff: parsed.promo.amountOff ?? null,
          startsAt: parsed.promo.startsAt ?? null,
          endsAt: parsed.promo.endsAt ?? null,
          firstOrderOnly: parsed.promo.firstOrderOnly,
        },
      },
      request,
    );
    return NextResponse.json({ ok: true, promo: parsed.promo });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save promo code." },
      { status: 400 },
    );
  }
}
