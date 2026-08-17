import type { Metadata } from "next";
import Link from "next/link";
import { formatUSD } from "@/lib/checkout/pricing";
import { requireAdminSession } from "@/lib/admin/auth";
import { getOrderStore } from "@/lib/orders";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { AdminOrderActions } from "@/components/AdminOrderActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  await requireAdminSession();

  const orders = await getOrderStore().list();

  return (
    <div className="site-shell py-20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label">Admin</p>
          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Orders
          </h1>
          <p className="mt-4 text-sm text-ink-soft">
            {orders.length} order{orders.length === 1 ? "" : "s"} recorded.
          </p>
          <p className="mt-3 text-sm">
            <Link
              href="/admin/inventory"
              className="link-underline text-ink-soft"
            >
              Inventory →
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

      {orders.length === 0 ? (
        <p className="mt-14 border-t border-line pt-14 text-sm text-ink-soft">
          No orders yet.
        </p>
      ) : (
        <div className="mt-12 flex flex-col gap-10">
          {orders.map((order) => (
            <article
              key={order.orderId}
              className="border-t border-line pt-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">
                    {order.orderId}
                  </h2>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-ink-soft">
                    {new Date(order.createdAt).toLocaleString()} ·{" "}
                    {order.provider}
                    {order.transactionId ? ` · ${order.transactionId}` : ""}
                  </p>
                  <p className="mt-2 text-sm text-ink-soft">
                    Payment:{" "}
                    <span className="text-ink">{order.paymentStatus}</span>
                    {" · "}
                    Fulfillment:{" "}
                    <span className="text-ink">{order.fulfillmentStatus}</span>
                    {order.refundedAmount > 0
                      ? ` · Refunded ${formatUSD(order.refundedAmount)}`
                      : ""}
                    {order.tax > 0 ? ` · Tax ${formatUSD(order.tax)}` : ""}
                  </p>
                </div>
                <p className="font-display text-lg font-semibold tabular-nums text-ink">
                  {formatUSD(order.total)}
                </p>
              </div>

              <div className="mt-4 grid gap-4 text-sm text-ink-soft sm:grid-cols-3">
                <div>
                  <p className="text-ink">
                    {order.customer.firstName} {order.customer.lastName}
                  </p>
                  <p>{order.customer.email}</p>
                </div>
                <div>
                  {order.customer.city}, {order.customer.state}{" "}
                  {order.customer.zip}
                </div>
                <div>
                  {order.items.map((item) => (
                    <span key={item.sku} className="block">
                      {item.name} ({item.size}) &times;{item.qty}
                    </span>
                  ))}
                </div>
              </div>

              <AdminOrderActions
                orderId={order.orderId}
                canRefund={
                  order.paymentStatus === "approved" ||
                  order.paymentStatus === "partially_refunded"
                }
                canFulfill={order.paymentStatus === "approved"}
                fulfillmentStatus={order.fulfillmentStatus}
                paymentStatus={order.paymentStatus}
                carrier={order.carrier}
                trackingNumber={order.trackingNumber}
                trackingUrl={order.trackingUrl}
              />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
