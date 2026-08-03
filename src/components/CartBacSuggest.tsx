"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { RelatedProductPurchase } from "@/components/RelatedProductPurchase";
import {
  getProductBySlug,
  productImageAlt,
  productPrimaryImage,
} from "@/data/products";
import {
  allVariantsOutOfStock,
  shouldSuggestBac,
} from "@/lib/cart/cartSuggest";
import type { ResolvedCartLine } from "@/lib/cart/types";

type CartBacSuggestProps = {
  resolved: ResolvedCartLine[];
  /** Tighter spacing for the cart drawer. */
  compact?: boolean;
};

export function CartBacSuggest({
  resolved,
  compact = false,
}: CartBacSuggestProps) {
  const product = getProductBySlug("bac");
  const [availability, setAvailability] = useState<
    Record<string, number | null> | null
  >(null);

  useEffect(() => {
    if (!product || !shouldSuggestBac(resolved)) {
      setAvailability(null);
      return;
    }

    // Drop prior stock before refetch so a stale in-stock map cannot enable Add.
    setAvailability(null);

    const skus = product.variants.map((variant) => variant.sku);
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/availability?skus=${encodeURIComponent(skus.join(","))}`,
        );
        if (!response.ok) {
          throw new Error("availability request failed");
        }
        const json = (await response.json()) as {
          data?: Record<string, number | null>;
        };
        if (!cancelled) {
          setAvailability(json.data ?? closedAvailability(skus));
        }
      } catch {
        if (!cancelled) {
          // Fail closed: do not allow add when stock cannot be confirmed.
          setAvailability(closedAvailability(skus));
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [product, resolved]);

  if (!shouldSuggestBac(resolved) || !product) {
    return null;
  }

  // Wait for stock before rendering — avoids flashing BAC then vanishing when OOS.
  if (!availability || allVariantsOutOfStock(product.variants, availability)) {
    return null;
  }

  const image = productPrimaryImage(product);

  return (
    <aside
      className={`border-t border-line ${compact ? "mt-2 pt-4" : "mt-8 pt-8"}`}
      aria-label="Suggested supply"
    >
      <p className="label !text-ink-soft">Also useful</p>
      <div className={`flex gap-4 ${compact ? "mt-3" : "mt-4"}`}>
        <div
          className={`relative aspect-square shrink-0 overflow-hidden border border-line bg-white ${
            compact ? "w-32" : "w-40"
          }`}
        >
          {image ? (
            <Image
              src={image}
              alt={productImageAlt(product)}
              fill
              sizes={compact ? "128px" : "160px"}
              className="object-contain p-0.5"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold tracking-tight text-ink">
            {product.name}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            Reconstitution diluent for lyophilized stocks in your cart
          </p>
          <RelatedProductPurchase
            product={product}
            availability={availability}
          />
        </div>
      </div>
    </aside>
  );
}

function closedAvailability(skus: string[]): Record<string, number | null> {
  const map: Record<string, number | null> = {};
  for (const sku of skus) {
    map[sku] = 0;
  }
  return map;
}
