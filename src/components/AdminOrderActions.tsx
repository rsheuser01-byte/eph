"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: string;
  canRefund: boolean;
  canFulfill: boolean;
  fulfillmentStatus: string;
  paymentStatus: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
};

export function AdminOrderActions({
  orderId,
  canRefund,
  canFulfill,
  fulfillmentStatus,
  paymentStatus,
  carrier = "",
  trackingNumber = "",
  trackingUrl = "",
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [shipCarrier, setShipCarrier] = useState(carrier);
  const [shipTracking, setShipTracking] = useState(trackingNumber);
  const [shipUrl, setShipUrl] = useState(trackingUrl);

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

  const showShipForm =
    canFulfill &&
    fulfillmentStatus !== "shipped" &&
    fulfillmentStatus !== "fulfilled" &&
    fulfillmentStatus !== "cancelled";

  return (
    <div className="mt-4 flex flex-col gap-3">
      {showShipForm ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            className="border border-line bg-panel px-3 py-2 text-sm text-ink"
            placeholder="Carrier"
            value={shipCarrier}
            onChange={(e) => setShipCarrier(e.target.value)}
            disabled={pending}
          />
          <input
            className="border border-line bg-panel px-3 py-2 text-sm text-ink"
            placeholder="Tracking number"
            value={shipTracking}
            onChange={(e) => setShipTracking(e.target.value)}
            disabled={pending}
            required
          />
          <input
            className="border border-line bg-panel px-3 py-2 text-sm text-ink"
            placeholder="Tracking URL (optional)"
            value={shipUrl}
            onChange={(e) => setShipUrl(e.target.value)}
            disabled={pending}
          />
        </div>
      ) : null}

      {(carrier || trackingNumber) &&
      (fulfillmentStatus === "shipped" || fulfillmentStatus === "fulfilled") ? (
        <p className="text-sm text-ink-soft">
          {carrier ? `${carrier} · ` : ""}
          {trackingNumber}
          {trackingUrl ? (
            <>
              {" · "}
              <a
                href={trackingUrl}
                className="link-underline"
                target="_blank"
                rel="noreferrer"
              >
                Track
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {showShipForm ? (
          <>
            <button
              type="button"
              disabled={pending || !shipTracking.trim()}
              className="btn btn-ghost border-ink text-ink !py-2 !text-[0.68rem] disabled:opacity-50"
              onClick={() =>
                run(
                  `/api/admin/orders/${encodeURIComponent(orderId)}/fulfillment`,
                  {
                    fulfillmentStatus: "shipped",
                    carrier: shipCarrier.trim() || undefined,
                    trackingNumber: shipTracking.trim(),
                    trackingUrl: shipUrl.trim() || undefined,
                  },
                )
              }
            >
              Mark shipped
            </button>
            <button
              type="button"
              disabled={pending}
              className="btn btn-ghost border-ink text-ink !py-2 !text-[0.68rem]"
              onClick={() =>
                run(
                  `/api/admin/orders/${encodeURIComponent(orderId)}/fulfillment`,
                  { fulfillmentStatus: "fulfilled" },
                )
              }
            >
              Mark fulfilled
            </button>
            <button
              type="button"
              disabled={pending}
              className="btn btn-ghost border-ink text-ink !py-2 !text-[0.68rem]"
              onClick={() =>
                run(
                  `/api/admin/orders/${encodeURIComponent(orderId)}/fulfillment`,
                  { fulfillmentStatus: "cancelled" },
                )
              }
            >
              Cancel order
            </button>
          </>
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
        {paymentStatus === "approved" ? (
          <button
            type="button"
            disabled={pending}
            className="btn btn-ghost border-ink text-ink !py-2 !text-[0.68rem]"
            onClick={() =>
              run(
                `/api/admin/orders/${encodeURIComponent(orderId)}/resend-email`,
                { kind: "confirmation" },
              )
            }
          >
            Resend confirmation
          </button>
        ) : null}
        {fulfillmentStatus === "shipped" || fulfillmentStatus === "fulfilled" ? (
          <button
            type="button"
            disabled={pending}
            className="btn btn-ghost border-ink text-ink !py-2 !text-[0.68rem]"
            onClick={() =>
              run(
                `/api/admin/orders/${encodeURIComponent(orderId)}/resend-email`,
                { kind: "shipped" },
              )
            }
          >
            Resend shipping email
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
