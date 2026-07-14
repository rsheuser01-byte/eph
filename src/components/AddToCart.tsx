"use client";

import { useState } from "react";
import type { Product } from "@/data/products";
import { useCart } from "@/lib/cart/CartContext";
import { formatUSD } from "@/lib/checkout/pricing";

type AddToCartProps = {
  product: Product;
};

export function AddToCart({ product }: AddToCartProps) {
  const { add } = useCart();
  const [size, setSize] = useState(product.variants[0]?.size ?? "");
  const [qty, setQty] = useState(1);

  const variant = product.variants.find((item) => item.size === size);
  const hasVariants = product.variants.length > 0;

  function handleAdd() {
    if (!variant) {
      return;
    }
    add(product.slug, variant.size, qty);
  }

  return (
    <div className="flex flex-col gap-6">
      {product.variants.length > 1 ? (
        <div>
          <label
            htmlFor="variant-size"
            className="label mb-3 block !text-ink-soft"
          >
            Vial size
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((item) => {
              const active = item.size === size;
              return (
                <button
                  key={item.sku}
                  type="button"
                  onClick={() => setSize(item.size)}
                  data-active={active}
                  className={`border px-4 py-2.5 text-sm font-semibold tabular-nums transition ${
                    active
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"
                  }`}
                >
                  {item.size}
                  <span className="ml-2 text-ink-soft">
                    {formatUSD(item.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {variant ? (
        <p className="font-display text-3xl font-semibold tracking-tight text-ink">
          {formatUSD(variant.price)}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex items-center border border-line">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((value) => Math.max(1, value - 1))}
            className="px-4 py-3 text-lg text-ink-soft transition hover:text-ink"
          >
            −
          </button>
          <span className="min-w-10 text-center text-sm font-semibold tabular-nums text-ink">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((value) => Math.min(99, value + 1))}
            className="px-4 py-3 text-lg text-ink-soft transition hover:text-ink"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!hasVariants || !variant}
          className="btn btn-primary btn-arrow flex-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
