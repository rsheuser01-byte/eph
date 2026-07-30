"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/data/products";
import { ProductAssaySignals } from "@/components/ProductAssaySignals";
import { RestockNotifyForm } from "@/components/RestockNotifyForm";
import { useCart } from "@/lib/cart/CartContext";
import { formatUSD } from "@/lib/checkout/pricing";

type ProductPurchaseProps = {
  product: Product;
  disclaimer: string;
  /** sku -> qty on hand. null means inventory not configured (treat as available). */
  availability?: Record<string, number | null>;
};

export function ProductPurchase({
  product,
  disclaimer,
  availability = {},
}: ProductPurchaseProps) {
  const { add } = useCart();
  const [size, setSize] = useState(product.variants[0]?.size ?? "");
  const [qty, setQty] = useState(1);

  const variant = product.variants.find((item) => item.size === size);
  const hasVariants = product.variants.length > 0;
  const stock =
    variant && Object.prototype.hasOwnProperty.call(availability, variant.sku)
      ? availability[variant.sku]
      : null;
  const inStock = stock === null || stock === undefined || stock > 0;
  const maxQty = stock === null || stock === undefined ? 99 : Math.max(0, stock);
  const showNotify = Boolean(variant) && (!inStock || maxQty < 1);
  const showAssay = product.category !== "Supply";

  function handleAdd() {
    if (!variant || !inStock) {
      return;
    }
    add(product.slug, variant.size, Math.min(qty, maxQty || 1));
  }

  return (
    <div className="mt-14">
      <p className="label">{product.category}</p>
      <h1 className="font-display mt-4 text-5xl font-semibold tracking-tight text-ink sm:text-7xl">
        {product.name}
      </h1>
      <p className="mt-5 text-xs uppercase tracking-[0.18em] text-ink-soft">
        SKU {product.sku}
      </p>
      <p className="mt-8 max-w-2xl text-base leading-relaxed text-ink-soft">
        {product.shortDescription}
      </p>

      {showAssay ? (
        <ProductAssaySignals productSlug={product.slug} variant="detail" />
      ) : null}

      <div className="mt-10 grid gap-10 border-t border-line pt-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)] sm:items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <div className="min-w-0 max-w-md">
          {product.variants.length > 1 ? (
            <div>
              <p className="label mb-3 !text-ink-soft">Vial size</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((item) => {
                  const active = item.size === size;
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
                      className={`border px-4 py-2.5 text-sm font-semibold tabular-nums transition ${
                        active
                          ? "border-accent bg-accent/10 text-ink"
                          : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"
                      } ${itemInStock ? "" : "opacity-50"}`}
                    >
                      {item.size}
                      <span className="ml-2 text-ink-soft">
                        {formatUSD(item.price)}
                      </span>
                      {!itemInStock ? (
                        <span className="ml-2 text-[0.65rem] uppercase tracking-[0.12em]">
                          Out
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {variant ? (
            <p
              className={`font-display text-3xl font-semibold tracking-tight text-ink ${
                product.variants.length > 1 ? "mt-8" : ""
              }`}
            >
              {formatUSD(variant.price)}
            </p>
          ) : null}

          {showNotify && variant ? (
            <RestockNotifyForm
              key={variant.sku}
              productSlug={product.slug}
              productName={product.name}
              sku={variant.sku}
              size={variant.size}
            />
          ) : (
            <div
              className={`flex flex-col gap-3 sm:flex-row sm:items-stretch ${
                variant ? "mt-6" : ""
              }`}
            >
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
                  onClick={() =>
                    setQty((value) => Math.min(Math.max(maxQty, 1), value + 1))
                  }
                  className="px-4 py-3 text-lg text-ink-soft transition hover:text-ink"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={!hasVariants || !variant || !inStock || maxQty < 1}
                className="btn btn-primary btn-arrow flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to cart
              </button>
            </div>
          )}

          {stock !== null && stock !== undefined && stock > 0 ? (
            <p className="mt-3 text-xs text-ink-soft">{stock} in stock</p>
          ) : null}

          <p className="mt-12 text-[0.7rem] leading-relaxed text-ink-soft/80">
            {disclaimer}
          </p>
        </div>

        {product.variants.some((item) => item.image) ? (
          <div className="relative mx-auto aspect-square w-full max-w-[18rem] overflow-hidden border border-line bg-white sm:mx-0 sm:justify-self-end">
            {product.variants.map((item) =>
              item.image ? (
                <Image
                  key={item.sku}
                  src={item.image}
                  alt={`${product.name} ${item.size} research vial`}
                  fill
                  sizes="288px"
                  priority={item.size === product.variants[0]?.size}
                  className={`object-contain object-center p-3 transition-opacity duration-200 ${
                    item.size === size
                      ? "opacity-100"
                      : "pointer-events-none opacity-0"
                  }`}
                />
              ) : null,
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
