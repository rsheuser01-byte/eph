"use client";

import { useEffect, useMemo, useState } from "react";
import type { ResolvedCartLine } from "@/lib/cart/types";

type AvailabilityMap = Record<string, number | null>;

/**
 * Live stock for cart line SKUs. null while loading or after fetch failure
 * (increase stays blocked; existing qty is not wiped).
 */
export function useCartAvailability(
  resolved: ResolvedCartLine[],
): AvailabilityMap | null {
  const skuKey = useMemo(() => {
    const skus = [
      ...new Set(resolved.map((item) => item.variant.sku).filter(Boolean)),
    ];
    skus.sort();
    return skus.join(",");
  }, [resolved]);

  const [availability, setAvailability] = useState<AvailabilityMap | null>(
    null,
  );

  useEffect(() => {
    if (!skuKey) {
      setAvailability({});
      return;
    }

    setAvailability(null);
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/availability?skus=${encodeURIComponent(skuKey)}`,
        );
        if (!response.ok) {
          throw new Error("availability request failed");
        }
        const json = (await response.json()) as {
          data?: AvailabilityMap;
        };
        if (!cancelled) {
          setAvailability(json.data ?? {});
        }
      } catch {
        if (!cancelled) {
          // Fail soft: keep null so qty cannot increase above current.
          setAvailability(null);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [skuKey]);

  return availability;
}
