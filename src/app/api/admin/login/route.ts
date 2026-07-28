import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_MS,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  passwordsMatch,
} from "@/lib/admin/session";
import { writeAuditLog } from "@/lib/security/audit";
import {
  RATE_LIMITS,
  checkRateLimit,
  clientIpFromRequest,
  tooManyRequestsResponse,
} from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const expected = process.env.ADMIN_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "Admin access is not configured." },
      { status: 503 },
    );
  }

  const ip = clientIpFromRequest(request);
  const limited = await checkRateLimit(
    "adminLogin",
    `ip:${ip}`,
    RATE_LIMITS.adminLogin,
  );
  if (!limited.allowed) {
    await writeAuditLog(
      {
        actor: "anonymous",
        action: "admin.login.rate_limited",
        metadata: { remaining: limited.remaining },
      },
      request,
    );
    return tooManyRequestsResponse(
      "Too many login attempts. Try again later.",
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!(await passwordsMatch(password, expected))) {
    await writeAuditLog(
      {
        actor: "anonymous",
        action: "admin.login.failure",
      },
      request,
    );
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 },
    );
  }

  const session = await createAdminSessionToken();
  await writeAuditLog(
    {
      actor: "admin",
      action: "admin.login.success",
    },
    request,
  );
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    session,
    getAdminSessionCookieOptions(Math.floor(ADMIN_SESSION_TTL_MS / 1000)),
  );
  return response;
}
