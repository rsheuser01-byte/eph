"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navLinks, site } from "@/data/site";
import { useCart } from "@/lib/cart/CartContext";

// The header shows a dedicated "Products" CTA button, so drop it from the
// inline text nav to avoid listing Products twice.
const headerLinks = navLinks.filter((link) => link.href !== "/products");

export function SiteHeader() {
  const pathname = usePathname();
  const { count, openCart } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-[background,border-color,height] duration-300 ${
        scrolled
          ? "border-white/15 bg-[rgba(4,7,15,0.94)]"
          : "border-white/10 bg-[rgba(6,11,22,0.8)]"
      }`}
    >
      <div
        className={`site-shell flex items-center justify-between gap-4 transition-[height] duration-300 ${
          scrolled ? "h-[4.25rem] sm:h-[4.5rem]" : "h-20 sm:h-[5.25rem]"
        }`}
      >
        <Link
          href="/"
          className="group relative shrink-0"
          onClick={() => setOpen(false)}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[240%] w-[175%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.6)_0%,rgba(255,255,255,0.24)_40%,transparent_76%)] blur-[8px] transition duration-300 group-hover:opacity-90"
          />
          <Image
            src="/images/logo-header-transparent.png"
            alt={site.name}
            width={1022}
            height={255}
            priority
            unoptimized
            className={`relative z-[1] w-auto max-w-[min(100%,280px)] transition-[height] duration-300 sm:max-w-[340px] ${
              scrolled ? "h-12" : "h-14 sm:h-16"
            }`}
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {headerLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                data-active={active}
                className="nav-link text-[0.72rem] font-semibold uppercase tracking-[0.16em]"
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/products"
            className="btn btn-light btn-arrow !py-2.5 !text-[0.68rem]"
          >
            Products
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <CartButton count={count} onClick={openCart} />

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-white/25 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-on-dark transition hover:border-white/50 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-white/10 bg-panel px-5 py-5 md:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-1">
            {headerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-white/10 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-on-dark"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/products"
              className="btn btn-light mt-4"
              onClick={() => setOpen(false)}
            >
              Products
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function CartButton({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center border border-white/25 px-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-on-dark transition hover:border-white/50"
    >
      Cart
      {count > 0 ? (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[0.62rem] font-bold tabular-nums text-[#04070f]">
          {count}
        </span>
      ) : null}
    </button>
  );
}
