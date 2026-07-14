import { formatUSD } from "@/lib/checkout/pricing";
import { getOrderStore } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminOrdersPageProps = {
  searchParams: Promise<{ key?: string }>;
};

function Unauthorized() {
  return (
    <div className="site-shell py-24">
      <p className="label">Admin</p>
      <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-ink">
        Orders
      </h1>
      <p className="mt-6 text-sm text-ink-soft">
        Access denied. Append <code>?key=YOUR_ADMIN_TOKEN</code> to the URL.
      </p>
    </div>
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const { key } = await searchParams;
  const token = process.env.ADMIN_TOKEN;

  if (!token || key !== token) {
    return <Unauthorized />;
  }

  const orders = await getOrderStore().list();

  return (
    <div className="site-shell py-20">
      <p className="label">Admin</p>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Orders
      </h1>
      <p className="mt-4 text-sm text-ink-soft">
        {orders.length} order{orders.length === 1 ? "" : "s"} recorded.
      </p>

      {orders.length === 0 ? (
        <p className="mt-14 border-t border-line pt-14 text-sm text-ink-soft">
          No orders yet.
        </p>
      ) : (
        <div className="mt-12 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink/20 text-[0.68rem] uppercase tracking-[0.14em] text-ink-soft">
                <th className="py-3 pr-4 font-semibold">Order</th>
                <th className="py-3 pr-4 font-semibold">Date</th>
                <th className="py-3 pr-4 font-semibold">Customer</th>
                <th className="py-3 pr-4 font-semibold">Ship to</th>
                <th className="py-3 pr-4 font-semibold">Items</th>
                <th className="py-3 pr-4 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId} className="border-b border-line align-top">
                  <td className="py-4 pr-4">
                    <span className="font-semibold text-ink">
                      {order.orderId}
                    </span>
                    <span className="mt-1 block text-xs text-ink-soft">
                      {order.provider}
                      {order.transactionId ? ` · ${order.transactionId}` : ""}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-ink-soft">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="py-4 pr-4 text-ink-soft">
                    <span className="block text-ink">
                      {order.customer.firstName} {order.customer.lastName}
                    </span>
                    {order.customer.email}
                  </td>
                  <td className="py-4 pr-4 text-ink-soft">
                    {order.customer.city}, {order.customer.state}{" "}
                    {order.customer.zip}
                  </td>
                  <td className="py-4 pr-4 text-ink-soft">
                    {order.items.map((item) => (
                      <span key={item.sku} className="block">
                        {item.name} ({item.size}) &times;{item.qty}
                      </span>
                    ))}
                  </td>
                  <td className="py-4 pr-4 text-right font-semibold tabular-nums text-ink">
                    {formatUSD(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
