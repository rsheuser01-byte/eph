import type { Metadata } from "next";
import Link from "next/link";
import { products } from "@/data/products";
import { requireAdminSession } from "@/lib/admin/auth";
import { listInventory, listMovements } from "@/lib/inventory";
import { AdminInventoryAdjust } from "@/components/AdminInventoryAdjust";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inventory",
  robots: { index: false, follow: false },
};

function productLabel(sku: string): string {
  for (const product of products) {
    const variant = product.variants.find((item) => item.sku === sku);
    if (variant) {
      return `${product.name} · ${variant.size}`;
    }
  }
  return sku;
}

export default async function AdminInventoryPage() {
  await requireAdminSession();

  const [rows, movements] = await Promise.all([
    listInventory(),
    listMovements(undefined, 30),
  ]);

  const bySku = new Map(rows.map((row) => [row.sku, row]));
  const catalogRows = products.flatMap((product) =>
    product.variants.map((variant) => ({
      sku: variant.sku,
      label: `${product.name} · ${variant.size}`,
      quantityOnHand: bySku.get(variant.sku)?.quantityOnHand ?? 0,
      quantityAvailable: bySku.get(variant.sku)?.quantityAvailable ?? 0,
    })),
  );

  return (
    <div className="site-shell py-20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label">Admin</p>
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Inventory
          </h1>
          <p className="mt-4 text-sm text-ink-soft">
            Simple quantity on hand per variant SKU (available excludes active
            checkout reservations).
          </p>
          <p className="mt-3 text-sm">
            <Link href="/admin/orders" className="link-underline text-ink-soft">
              ← Orders
            </Link>
            {" · "}
            <Link
              href="/admin/abandoned-carts"
              className="link-underline text-ink-soft"
            >
              Abandoned carts →
            </Link>
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      {rows.length === 0 ? (
        <p className="mt-14 border-t border-line pt-14 text-sm text-ink-soft">
          No inventory rows found. Configure Supabase and seed SKUs (admin
          inventory API with <code>seed: true</code>), or add stock after
          connecting <code>SUPABASE_SERVICE_ROLE_KEY</code>.
        </p>
      ) : (
        <div className="mt-12 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink/20 text-[0.68rem] uppercase tracking-[0.14em] text-ink-soft">
                <th className="py-3 pr-4 font-semibold">SKU</th>
                <th className="py-3 pr-4 font-semibold">Product</th>
                <th className="py-3 pr-4 font-semibold">On hand</th>
                <th className="py-3 pr-4 font-semibold">Available</th>
                <th className="py-3 pr-4 font-semibold">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {catalogRows.map((row) => (
                <tr key={row.sku} className="border-b border-line">
                  <td className="py-4 pr-4 font-semibold text-ink">{row.sku}</td>
                  <td className="py-4 pr-4 text-ink-soft">{row.label}</td>
                  <td className="py-4 pr-4 tabular-nums text-ink">
                    {row.quantityOnHand}
                  </td>
                  <td className="py-4 pr-4 tabular-nums text-ink">
                    {row.quantityAvailable}
                  </td>
                  <td className="py-4 pr-4">
                    <AdminInventoryAdjust sku={row.sku} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Recent movements
        </h2>
        {movements.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">No movements yet.</p>
        ) : (
          <ul className="mt-6 space-y-3 text-sm text-ink-soft">
            {movements.map((move) => (
              <li key={move.id} className="border-b border-line pb-3">
                <span className="text-ink">{productLabel(move.sku)}</span>
                {" · "}
                <span className="tabular-nums">
                  {move.delta > 0 ? "+" : ""}
                  {move.delta}
                </span>
                {" · "}
                {move.reason}
                {move.orderId ? ` · ${move.orderId}` : ""}
                {" · "}
                {new Date(move.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
