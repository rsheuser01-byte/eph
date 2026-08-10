"use client";

import { useState } from "react";
import type { Product } from "@/data/products";
import { useCart } from "@/lib/cart/CartContext";
import { formatUSD } from "@/lib/checkout/pricing";
import {
  defaultInStockSize,
  resolveInStockSize,
} from "@/lib/products/defaultInStockSize";

type RelatedProductPurchaseProps = {
  product: Product;
  /** sku -> qty on hand. null means inventory not configured (treat as available). */
  availability?: Record<string, number | null>;
  /** Tighter controls for compact catalog tiles. */
  dense?: boolean;
};

export function RelatedProductPurchase({
  product,
  availability = {},
  dense = false,
}: RelatedProductPurchaseProps) {
  const { add } = useCart();
  const [size, setSize] = useState(() =>
    defaultInStockSize(product.variants, availability),
  );

  // Re-resolve when availability updates so a stale OOS selection cannot stick.
  const activeSize = resolveInStockSize(
    size,
    product.variants,
    availability,
  );
  const variant = product.variants.find((item) => item.size === activeSize);
  const showSizes = product.variants.length > 1;
  const stock =
    variant && Object.prototype.hasOwnProperty.call(availability, variant.sku)
      ? availability[variant.sku]
      : null;
  const inStock = stock === null || stock === undefined || stock > 0;
  const maxQty = stock === null || stock === undefined ? 99 : Math.max(0, stock);
  const canAdd = Boolean(variant) && inStock && maxQty > 0;

  function handleAdd() {
    if (!variant || !inStock || maxQty < 1) {
      return;
    }
    add(product.slug, variant.size, 1, maxQty);
  }

  return (
    <div className={dense ? "mt-2 space-y-2" : "mt-3 space-y-3"}>
      {showSizes ? (
        <div className={`flex flex-wrap ${dense ? "gap-1" : "gap-1.5"}`}>
          {product.variants.map((item) => {
            const active = item.size === activeSize;
            const itemStock = Object.prototype.hasOwnProperty.call(
              availability,
              item.sku,
            )
              ? availability[item.sku]
              : null;
            const itemInStock =
              itemStock === null ||
              itemStock === undefined ||
              itemStock > 0;
            return (
              <button
                key={item.sku}
                type="button"
                onClick={() => setSize(item.size)}
                data-active={active}
                className={`border font-semibold tabular-nums transition ${
                  dense
                    ? "px-2 py-1 text-[0.65rem]"
                    : "px-2.5 py-1.5 text-xs"
                } ${
                  active
                    ? "border-accent bg-accent/10 text-ink"
                    : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"
                } ${itemInStock ? "" : "opacity-50"}`}
              >
                {item.size}
                {!itemInStock ? (
                  <span className="ml-1.5 text-[0.6rem] uppercase tracking-[0.12em]">
                    Out
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className={`flex flex-wrap items-center ${dense ? "gap-2" : "gap-3"}`}>
        {variant ? (
          <span
            className={`font-semibold tabular-nums text-ink ${
              dense ? "text-xs" : "text-sm"
            }`}
          >
            {formatUSD(variant.price)}
          </span>
        ) : null}
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className={`btn btn-primary disabled:cursor-not-allowed disabled:opacity-50 ${
            dense ? "px-2.5 py-1.5 text-[0.65rem]" : "px-3 py-2 text-xs"
          }`}
        >
          {canAdd ? "Add to cart" : "Out of stock"}
        </button>
      </div>
    </div>
  );
}
