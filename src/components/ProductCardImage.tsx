"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ProductCardImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  /** Start fetching immediately (below-fold catalog that users reach next). */
  eager?: boolean;
  compact?: boolean;
  /** Stagger fade-in so catalog tiles appear in phases. */
  fadeDelayMs?: number;
  sizes: string;
};

/**
 * Full-quality packshot with a load-triggered fade. Delay lets homepage
 * tiles cascade in waves instead of popping in as a soft block of thumbs.
 */
export function ProductCardImage({
  src,
  alt,
  priority = false,
  eager = false,
  compact = false,
  fadeDelayMs = 0,
  sizes,
}: ProductCardImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const visible = loaded || reduceMotion;

  return (
    <Image
      src={`${src}?v=8`}
      alt={alt}
      fill
      priority={priority}
      loading={priority ? undefined : eager ? "eager" : "lazy"}
      unoptimized
      sizes={sizes}
      onLoad={() => setLoaded(true)}
      className={`object-contain transition-[opacity,transform] duration-500 ease-out group-hover:scale-[1.03] ${
        compact ? "p-2 sm:p-3" : "p-4"
      } ${visible ? "opacity-100" : "opacity-0"}`}
      style={
        visible && !reduceMotion && fadeDelayMs > 0
          ? { transitionDelay: `${fadeDelayMs}ms` }
          : undefined
      }
    />
  );
}
