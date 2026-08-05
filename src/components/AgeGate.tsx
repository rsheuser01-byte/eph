"use client";

import { useEffect, useState } from "react";
import { site } from "@/data/site";

/** Session-scoped — shows again on each new browser visit/session. */
export const AGE_VERIFIED_KEY = "eph-age-verified";

export function AgeGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      // Drop legacy forever-localStorage flag so returning visitors see the gate.
      window.localStorage.removeItem(AGE_VERIFIED_KEY);
      if (window.sessionStorage.getItem(AGE_VERIFIED_KEY) !== "true") {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function accept() {
    try {
      window.sessionStorage.setItem(AGE_VERIFIED_KEY, "true");
      window.localStorage.removeItem(AGE_VERIFIED_KEY);
    } catch {
      // Allow entry this load if storage is blocked.
    }
    setOpen(false);
  }

  function decline() {
    window.location.href = "https://www.google.com";
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="age-gate-backdrop fixed inset-0 z-[100] flex items-stretch justify-end bg-black/72 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div className="age-gate-panel surface-grain relative flex h-full w-full max-w-md flex-col justify-between bg-bg-elevated p-8 sm:p-12">
        <div className="relative z-[2]">
          <p className="label">Restricted</p>
          <h2
            id="age-gate-title"
            className="font-display mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-ink"
          >
            Confirm age {site.ageMinimum}+ for research access
          </h2>
          <p className="mt-6 text-[0.95rem] leading-relaxed text-ink-soft">
            Catalog entry is limited to qualified laboratory research. Products
            are not for human or veterinary use.
          </p>
        </div>
        <div className="relative z-[2] flex flex-col gap-3">
          <button type="button" onClick={accept} className="btn btn-primary">
            Enter
          </button>
          <button
            type="button"
            onClick={decline}
            className="py-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft transition hover:text-ink"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
