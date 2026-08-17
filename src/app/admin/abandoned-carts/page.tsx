import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/auth";
import { getSavedCartStore } from "@/lib/abandonedCart/store";
import { effectiveCartStatus } from "@/lib/abandonedCart/payload";
import { maskEmail } from "@/lib/abandonedCart/maskEmail";
import { formatUSD } from "@/lib/checkout/pricing";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Abandoned carts",
  robots: { index: false, follow: false },
};

export default async function AdminAbandonedCartsPage() {
  await requireAdminSession();
  const carts = await getSavedCartStore().listRecent(100);

  return (
    <div className="site-shell py-20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label">Admin</p>
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Abandoned carts
          </h1>
          <p className="mt-4 text-sm text-ink-soft">
            {carts.length} saved cart{carts.length === 1 ? "" : "s"} (newest
            100).
          </p>
          <p className="mt-3 text-sm">
            <Link href="/admin/orders" className="link-underline text-ink-soft">
              ← Orders
            </Link>
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      {carts.length === 0 ? (
        <p className="mt-14 border-t border-line pt-14 text-sm text-ink-soft">
          No saved carts yet.
        </p>
      ) : (
        <div className="mt-12 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink/20 text-[0.68rem] uppercase tracking-[0.14em] text-ink-soft">
                <th className="py-3 pr-4 font-semibold">Updated</th>
                <th className="py-3 pr-4 font-semibold">Email</th>
                <th className="py-3 pr-4 font-semibold">Items</th>
                <th className="py-3 pr-4 font-semibold">Total</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Identified</th>
                <th className="py-3 pr-4 font-semibold">Converted</th>
                <th className="py-3 font-semibold">Order</th>
              </tr>
            </thead>
            <tbody>
              {carts.map((cart) => {
                const status = effectiveCartStatus(cart);
                const itemCount = cart.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                );
                return (
                  <tr key={cart.id} className="border-b border-line">
                    <td className="py-3 pr-4 text-ink-soft">
                      {new Date(cart.updatedAt).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-ink">{maskEmail(cart.email)}</td>
                    <td className="py-3 pr-4 tabular-nums text-ink">{itemCount}</td>
                    <td className="py-3 pr-4 tabular-nums text-ink">
                      {formatUSD(cart.subtotal)}
                    </td>
                    <td className="py-3 pr-4 text-ink">{status}</td>
                    <td className="py-3 pr-4 text-ink-soft">
                      {cart.identifiedAt
                        ? new Date(cart.identifiedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-ink-soft">
                      {cart.convertedAt
                        ? new Date(cart.convertedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-3 text-ink-soft">{cart.orderId ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
