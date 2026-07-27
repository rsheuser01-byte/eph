import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="site-shell py-24">
      <p className="label">404</p>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
        Page not found
      </h1>
      <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink-soft">
        The page you were looking for could not be found. It may have moved, or
        the link may be out of date.
      </p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn btn-primary btn-arrow">
          Go home
        </Link>
        <Link href="/products" className="btn btn-ghost border-ink text-ink">
          Browse products
        </Link>
      </div>
    </div>
  );
}
