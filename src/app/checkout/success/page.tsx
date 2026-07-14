"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useCart } from "@/lib/cart/CartContext";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const { clear } = useCart();

  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div className="site-shell py-24">
      <p className="label">Order confirmed</p>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
        Thank you
      </h1>
      <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink-soft">
        Your order has been received and payment approved. A confirmation will
        be sent to the email you provided.
      </p>
      {orderId ? (
        <p className="mt-8 text-sm text-ink-soft">
          Order reference:{" "}
          <span className="font-semibold tracking-[0.12em] text-ink">
            {orderId}
          </span>
        </p>
      ) : null}
      <Link href="/products" className="btn btn-primary btn-arrow mt-10">
        Continue shopping
      </Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="site-shell py-24">
          <p className="text-sm text-ink-soft">Loading…</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
