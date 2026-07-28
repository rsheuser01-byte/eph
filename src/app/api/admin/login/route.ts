import { NextResponse } from "next/server";
import { allowAttempt } from "@/lib/admin/rateLimit";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_MS,
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  passwordsMatch,
} from "@/lib/admin/session";

export const runtime = "nodejs";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return `ip:${forwarded.split(",")[0]?.trim() || "unknown"}`;
  }
  return "ip:unknown";
}

export async function POST(request: Request) {
  const expected = process.env.ADMIN_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json(
      { error: "Admin access is not configured." },
      { status: 503 },
    );
  }

  if (!allowAttempt(clientKey(request), LOGIN_LIMIT, LOGIN_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 },
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
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 },
    );
  }

  const session = await createAdminSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    session,
    getAdminSessionCookieOptions(Math.floor(ADMIN_SESSION_TTL_MS / 1000)),
  );
  return response;
}
