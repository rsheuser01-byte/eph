"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CartBacSuggest } from "@/components/CartBacSuggest";
import { CartLineQtyControls } from "@/components/CartLineQtyControls";
import { useCart } from "@/lib/cart/CartContext";
import { useCartAvailability } from "@/lib/cart/useCartAvailability";
import { formatUSD, orderTotals } from "@/lib/checkout/pricing";

export function CartDrawer() {
  const {
    isOpen,
    closeCart,
    resolved,
    subtotal,
    setQty,
    remove,
    clampToAvailability,
  } = useCart();
  const availability = useCartAvailability(isOpen ? resolved : []);
  const { shipping, total } = orderTotals(subtotal);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, closeCart]);

  useEffect(() => {
    if (isOpen && availability) {
      clampToAvailability(availability);
    }
  }, [isOpen, availability, clampToAvailability]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-stretch justify-end bg-black/72 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping cart"
    >
      <button
        type="button"
        aria-label="Close cart"
        className="flex-1 cursor-default"
        onClick={closeCart}
      />
      <div className="age-gate-panel flex h-full w-full max-w-md flex-col bg-bg-elevated">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <p className="label !text-ink">Your cart</p>
          <button
            type="button"
            onClick={closeCart}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft transition hover:text-ink"
          >
            Close
          </button>
        </div>

        {resolved.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <p className="text-sm text-ink-soft">Your cart is empty.</p>
            <Link
              href="/products"
              className="btn btn-ghost border-ink text-ink"
              onClick={closeCart}
            >
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {resolved.map(({ line, product, variant, lineTotal }) => (
                <div
                  key={variant.sku}
                  className="flex gap-4 border-b border-line py-5"
                >
                  <div className="flex-1">
                    <p className="font-display text-lg font-semibold tracking-tight text-ink">
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-soft">
                      {variant.size} · {formatUSD(variant.price)}
                    </p>
                    <div className="mt-3">
                      <CartLineQtyControls
                        line={line}
                        sku={variant.sku}
                        availability={availability}
                        setQty={setQty}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <span className="text-sm font-semibold tabular-nums text-ink">
                      {formatUSD(lineTotal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(line.slug, line.size)}
                      className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-soft transition hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <CartBacSuggest resolved={resolved} compact />
            </div>

            <div className="border-t border-line px-6 py-6">
              <div className="flex items-center justify-between text-sm text-ink-soft">
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
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <span className="font-display text-lg font-semibold text-ink">
                  Total
                </span>
                <span className="font-display text-lg font-semibold tabular-nums text-ink">
                  {formatUSD(total)}
                </span>
              </div>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="btn btn-primary btn-arrow mt-6 w-full"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="mt-3 block text-center text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft transition hover:text-ink"
              >
                View cart
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
