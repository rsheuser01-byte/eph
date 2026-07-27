"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/data/products";
import { useCart } from "@/lib/cart/CartContext";
import { formatUSD } from "@/lib/checkout/pricing";

type ProductPurchaseProps = {
  product: Product;
  disclaimer: string;
};

export function ProductPurchase({ product, disclaimer }: ProductPurchaseProps) {
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

      <div className="mt-10 grid gap-10 border-t border-line pt-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)] sm:items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <div className="min-w-0 max-w-md">
          {product.variants.length > 1 ? (
            <div>
              <p className="label mb-3 !text-ink-soft">Vial size</p>
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
            <p
              className={`font-display text-3xl font-semibold tracking-tight text-ink ${
                product.variants.length > 1 ? "mt-8" : ""
              }`}
            >
              {formatUSD(variant.price)}
            </p>
          ) : null}

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

          <div className="mt-8">
            <Link
              href="/coa"
              className="link-underline text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft"
            >
              Assay policy →
            </Link>
          </div>

          <p className="mt-12 text-[0.7rem] leading-relaxed text-ink-soft/80">
            {disclaimer}
          </p>
        </div>

        {variant?.image ? (
          <div className="relative mx-auto aspect-square w-full max-w-[18rem] overflow-hidden border border-line bg-white sm:mx-0 sm:justify-self-end">
            <Image
              src={variant.image}
              alt={`${product.name} ${variant.size} research vial`}
              fill
              sizes="288px"
              className="object-contain p-3"
              priority
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
