"use client";

import { purchasableMaxQty } from "@/lib/cart/cart";
import type { CartLine } from "@/lib/cart/types";

type CartLineQtyControlsProps = {
  line: CartLine;
  sku: string;
  /** null = stock not confirmed yet (block increases). */
  availability: Record<string, number | null> | null;
  setQty: (slug: string, size: string, qty: number, maxQty?: number) => void;
};

export function CartLineQtyControls({
  line,
  sku,
  availability,
  setQty,
}: CartLineQtyControlsProps) {
  const maxQty =
    availability === null
      ? line.qty
      : purchasableMaxQty(sku, availability);
  const atMax = line.qty >= maxQty;

  return (
    <div className="flex items-center border border-line">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => setQty(line.slug, line.size, line.qty - 1, maxQty)}
        className="px-3 py-1.5 text-ink-soft transition hover:text-ink"
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-ink">
        {line.qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={atMax}
        onClick={() => setQty(line.slug, line.size, line.qty + 1, maxQty)}
        className="px-3 py-1.5 text-ink-soft transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
