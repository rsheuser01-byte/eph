"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { RelatedProductPurchase } from "@/components/RelatedProductPurchase";
import {
  getProductBySlug,
  productImageAlt,
  productPrimaryImage,
  type Product,
} from "@/data/products";
import {
  allVariantsOutOfStock,
  cartSuggestReason,
  getCartSuggestCandidates,
} from "@/lib/cart/cartSuggest";
import type { ResolvedCartLine } from "@/lib/cart/types";

type CartSuggestProps = {
  resolved: ResolvedCartLine[];
  /** Tighter spacing for the cart drawer. */
  compact?: boolean;
};

export function CartSuggest({ resolved, compact = false }: CartSuggestProps) {
  const candidates = useMemo(
    () =>
      getCartSuggestCandidates(resolved)
        .map((slug) => getProductBySlug(slug))
        .filter((product): product is Product => Boolean(product)),
    [resolved],
  );
  const [availability, setAvailability] = useState<
    Record<string, number | null> | null
  >(null);

  useEffect(() => {
    const nextCandidates = getCartSuggestCandidates(resolved)
      .map((slug) => getProductBySlug(slug))
      .filter((product): product is Product => Boolean(product));

    if (nextCandidates.length === 0) {
      setAvailability(null);
      return;
    }

    // Drop prior stock before refetch so a stale in-stock map cannot enable Add.
    setAvailability(null);

    const skus = nextCandidates.flatMap((product) =>
      product.variants.map((variant) => variant.sku),
    );
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
  }, [resolved]);

  const product =
    availability == null
      ? null
      : (candidates.find(
          (candidate) =>
            !allVariantsOutOfStock(candidate.variants, availability),
        ) ?? null);

  if (candidates.length === 0 || !product || !availability) {
    return null;
  }

  const image = productPrimaryImage(product);

  return (
    <aside
      className={`border-t border-line ${compact ? "mt-2 pt-4" : "mt-8 pt-8"}`}
      aria-label="Suggested product"
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
            {cartSuggestReason(product.slug)}
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
