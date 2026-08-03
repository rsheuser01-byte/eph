"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CartBacSuggest } from "@/components/CartBacSuggest";
import { CartLineQtyControls } from "@/components/CartLineQtyControls";
import { useCart } from "@/lib/cart/CartContext";
import { useCartAvailability } from "@/lib/cart/useCartAvailability";
import {
  FREE_SHIPPING_THRESHOLD,
  formatUSD,
  orderTotals,
} from "@/lib/checkout/pricing";

export default function CartPage() {
  const { resolved, subtotal, setQty, remove, clampToAvailability } = useCart();
  const availability = useCartAvailability(resolved);
  const { shipping, total } = orderTotals(subtotal);
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  useEffect(() => {
    if (availability) {
      clampToAvailability(availability);
    }
  }, [availability, clampToAvailability]);

  return (
    <div className="site-shell py-20">
      <p className="label">Cart</p>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
        Your cart
      </h1>

      {resolved.length === 0 ? (
        <div className="mt-14 border-t border-line pt-14">
          <p className="text-sm text-ink-soft">Your cart is empty.</p>
          <Link
            href="/products"
            className="btn btn-primary btn-arrow mt-8"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-14 grid gap-14 lg:grid-cols-[1.6fr_1fr]">
          <div className="border-t border-ink/20">
            {resolved.map(({ line, product, variant, lineTotal }) => (
              <div
                key={variant.sku}
                className="grid grid-cols-[1fr_auto] gap-6 border-b border-line py-7"
              >
                <div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-display text-xl font-semibold tracking-tight text-ink transition hover:text-accent"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-soft">
                    {variant.size} · {formatUSD(variant.price)} · SKU{" "}
                    {variant.sku}
                  </p>
                  <div className="mt-4 flex items-center gap-5">
                    <CartLineQtyControls
                      line={line}
                      sku={variant.sku}
                      availability={availability}
                      setQty={setQty}
                    />
                    <button
                      type="button"
                      onClick={() => remove(line.slug, line.size)}
                      className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-soft transition hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums text-ink">
                  {formatUSD(lineTotal)}
                </span>
              </div>
            ))}
            <CartBacSuggest resolved={resolved} />
          </div>

          <aside className="h-fit border border-line bg-bg-elevated p-8">
            <p className="label !text-ink">Summary</p>
            <div className="mt-6 flex items-center justify-between text-sm text-ink-soft">
              <span>Subtotal</span>
              <span className="tabular-nums text-ink">
                {formatUSD(subtotal)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-ink-soft">
              <span>Shipping</span>
              <span className="tabular-nums text-ink">
                {shipping === 0 ? "Free" : formatUSD(shipping)}
              </span>
            </div>
            {remaining > 0 ? (
              <p className="mt-3 text-xs leading-relaxed text-ink-soft">
                Add {formatUSD(remaining)} more for free shipping.
              </p>
            ) : null}
            <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
              <span className="font-display text-lg font-semibold text-ink">
                Total
              </span>
              <span className="font-display text-lg font-semibold tabular-nums text-ink">
                {formatUSD(total)}
              </span>
            </div>
            <Link href="/checkout" className="btn btn-primary btn-arrow mt-7 w-full">
              Proceed to checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
