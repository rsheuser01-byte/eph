import Link from "next/link";
import { navLinks, researchDisclaimer, site } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/12 bg-panel text-on-dark">
      <div className="site-shell py-16">
        <div className="grid gap-12 border-b border-white/12 pb-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Elevate
              <span className="mt-2 block text-base font-semibold uppercase tracking-[0.22em] text-[color:var(--on-dark-muted)]">
                Precision Health
              </span>
            </p>
            <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-[color:var(--on-dark-muted)]">
              {site.tagline}
            </p>
          </div>
          <div className="flex flex-col justify-between gap-8 sm:flex-row lg:justify-end lg:gap-16">
            <div>
              <p className="label label-on-dark">Navigate</p>
              <ul className="mt-4 space-y-3 text-sm text-[color:var(--on-dark-muted)]">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="link-underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label label-on-dark">Legal</p>
              <ul className="mt-4 space-y-3 text-sm text-[color:var(--on-dark-muted)]">
                <li>
                  <Link href="/privacy" className="link-underline">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="link-underline">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/refunds" className="link-underline">
                    Returns
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={`mailto:${site.email}`}
            className="link-underline text-sm text-[color:var(--on-dark-muted)]"
          >
            {site.email}
          </a>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--on-dark-soft)]">
            {site.shippingNote}
          </p>
        </div>

        <p className="max-w-3xl text-xs leading-relaxed text-[color:var(--on-dark-soft)]">
          {researchDisclaimer}
        </p>
        <p className="mt-8 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[color:var(--on-dark-soft)]">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
