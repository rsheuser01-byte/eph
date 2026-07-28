import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin/session";

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

/**
 * Server-side gate for admin pages that load sensitive data.
 * Proxy redirects are UX only — this is the real authorization check.
 */
export async function requireAdminSession(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

/** For API routes: return false instead of redirecting. */
export async function assertAdminApiSession(): Promise<boolean> {
  return isAdminAuthenticated();
}
