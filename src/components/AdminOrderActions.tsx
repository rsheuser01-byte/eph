"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: string;
  canRefund: boolean;
  canFulfill: boolean;
  fulfillmentStatus: string;
};

export function AdminOrderActions({
  orderId,
  canRefund,
  canFulfill,
  fulfillmentStatus,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(path: string, body?: Record<string, unknown>) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Action failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {canFulfill && fulfillmentStatus !== "fulfilled" ? (
          <button
            type="button"
            disabled={pending}
            className="btn btn-ghost border-ink text-ink !py-2 !text-[0.68rem]"
            onClick={() =>
              run(`/api/admin/orders/${encodeURIComponent(orderId)}/fulfillment`, {
                fulfillmentStatus: "fulfilled",
              })
            }
          >
            Mark fulfilled
          </button>
        ) : null}
        {canRefund ? (
          <button
            type="button"
            disabled={pending}
            className="btn btn-ghost border-ink text-ink !py-2 !text-[0.68rem]"
            onClick={() =>
              run(`/api/admin/orders/${encodeURIComponent(orderId)}/refund`, {})
            }
          >
            Refund
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
