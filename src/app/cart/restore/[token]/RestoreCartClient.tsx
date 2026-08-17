"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import type { CartLineInput } from "@/lib/abandonedCart/types";

type RestoreResponse =
  | { ok: true; lines: CartLineInput[]; droppedCount: number }
  | { ok?: false; error?: string };

export function RestoreCartClient({ token }: { token: string }) {
  const router = useRouter();
  const { replace } = useCart();
  const [message, setMessage] = useState("Restoring your cart…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    async function restore() {
      try {
        const response = await fetch("/api/abandoned-cart/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ token }),
        });
        const body = (await response.json()) as RestoreResponse;
        if (!response.ok || !body.ok) {
          setMessage(
            "This cart link is invalid or no longer available. Your current cart was not changed.",
          );
          return;
        }
        replace(body.lines);
        const notice =
          body.droppedCount > 0 ? "unavailable" : "restored";
        router.replace(`/cart?notice=${notice}`);
      } catch {
        setMessage(
          "We could not restore that cart right now. Please try again or continue shopping.",
        );
      }
    }

    void restore();
  }, [replace, router, token]);

  return (
    <div className="site-shell py-20">
      <p className="label">Cart</p>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Return to your cart
      </h1>
      <p className="mt-6 max-w-xl text-sm text-ink-soft">{message}</p>
    </div>
  );
}
