"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addLine,
  cartCount,
  cartSubtotal,
  removeLine,
  resolveLines,
  updateQty,
} from "./cart";
import type { CartLine, ResolvedCartLine } from "./types";

const STORAGE_KEY = "eph-cart";

type CartContextValue = {
  lines: CartLine[];
  resolved: ResolvedCartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  add: (slug: string, size: string, qty?: number) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  remove: (slug: string, size: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStored(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is CartLine =>
        typeof item?.slug === "string" &&
        typeof item?.size === "string" &&
        typeof item?.qty === "number",
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(readStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Ignore storage failures (private mode, quota, etc.).
    }
  }, [lines, hydrated]);

  const add = useCallback((slug: string, size: string, qty = 1) => {
    setLines((current) => addLine(current, slug, size, qty));
    setIsOpen(true);
  }, []);

  const setQty = useCallback((slug: string, size: string, qty: number) => {
    setLines((current) => updateQty(current, slug, size, qty));
  }, []);

  const remove = useCallback((slug: string, size: string) => {
    setLines((current) => removeLine(current, slug, size));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      resolved: resolveLines(lines),
      count: cartCount(lines),
      subtotal: cartSubtotal(lines),
      isOpen,
      add,
      setQty,
      remove,
      clear,
      openCart,
      closeCart,
    }),
    [lines, isOpen, add, setQty, remove, clear, openCart, closeCart],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
