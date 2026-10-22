import type { Metadata } from "next";
import Link from "next/link";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { AdminPromoCodes } from "@/components/AdminPromoCodes";
import { requireAdminSession } from "@/lib/admin/auth";
import { getPromoStore } from "@/lib/promo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promo codes",
  robots: { index: false, follow: false },
};

export default async function AdminPromosPage() {
  await requireAdminSession();

  let promos: Awaited<ReturnType<ReturnType<typeof getPromoStore>["list"]>> = [];
  let loadError: string | null = null;
  try {
    promos = await getPromoStore().list();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load promo codes.";
  }

  return (
    <div className="site-shell py-20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label">Admin</p>
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Promo codes
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ink-soft">
            Customers enter these at checkout. Deactivate turns a code off immediately.
            Activate turns that same code back on, with the same discount and dates.
            A start or end time still limits when an active code applies.
          </p>
          <p className="mt-3 text-sm">
            <Link href="/admin/orders" className="link-underline text-ink-soft">
              ← Orders
            </Link>
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      {loadError ? (
        <p className="mt-14 border-t border-line pt-14 text-sm text-red-700">{loadError}</p>
      ) : (
        <AdminPromoCodes promos={promos} />
      )}
    </div>
  );
}
