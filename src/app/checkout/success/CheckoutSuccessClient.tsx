"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrustpilotInvite } from "@/components/TrustpilotInvite";
import { useCart } from "@/lib/cart/CartContext";
import type { PublicOrderStatus } from "@/lib/orders/publicStatus";

type Props = {
  orderId: string;
  token: string;
  initial: PublicOrderStatus | null;
};

export function CheckoutSuccessClient({ orderId, token, initial }: Props) {
  const { clear } = useCart();
  const [status, setStatus] = useState<PublicOrderStatus | null>(initial);

  useEffect(() => {
    if (status?.paymentStatus === "approved") {
      clear();
    }
  }, [status?.paymentStatus, clear]);

  useEffect(() => {
    if (!status?.poll || !orderId || !token) {
      return;
    }

    let cancelled = false;
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderId)}/status?token=${encodeURIComponent(token)}`,
        );
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as PublicOrderStatus;
        if (!cancelled) {
          setStatus(data);
        }
      } catch {
        // Keep last known status on transient network errors.
      }
    };

    const id = window.setInterval(poll, 2500);
    void poll();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [status?.poll, orderId, token]);

  if (!status) {
    return (
      <div className="site-shell py-24">
        <p className="label">Order status</p>
        <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
          Order not found
        </h1>
        <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink-soft">
          We could not verify this order link. If you just completed payment,
          check your email for confirmation or contact support with your order
          reference.
        </p>
        {orderId ? (
          <p className="mt-8 text-sm text-ink-soft">
            Order reference:{" "}
            <span className="font-semibold tracking-[0.12em] text-ink">
              {orderId}
            </span>
          </p>
        ) : null}
        <Link href="/checkout" className="btn btn-primary btn-arrow mt-10">
          Return to checkout
        </Link>
      </div>
    );
  }

  const showRetry =
    status.paymentStatus === "declined" ||
    status.paymentStatus === "cancelled" ||
    status.paymentStatus === "expired";

  return (
    <div className="site-shell py-24">
      <p className="label">Order status</p>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
        {status.headline}
      </h1>
      <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink-soft">
        {status.message}
      </p>
      {status.reviewInvitation ? (
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
          Trustpilot may email you a short, optional invitation to review our
          ordering and support. That review is hosted by Trustpilot.
        </p>
      ) : null}
      {status.poll ? (
        <p className="mt-4 text-sm text-ink-soft">Checking for updates…</p>
      ) : null}
      <TrustpilotInvite invitation={status.reviewInvitation} />
      <p className="mt-8 text-sm text-ink-soft">
        Order reference:{" "}
        <span className="font-semibold tracking-[0.12em] text-ink">
          {status.orderId}
        </span>
      </p>
      {showRetry ? (
        <Link href="/checkout" className="btn btn-primary btn-arrow mt-10">
          Try checkout again
        </Link>
      ) : (
        <Link href="/products" className="btn btn-primary btn-arrow mt-10">
          Continue shopping
        </Link>
      )}
    </div>
  );
}
