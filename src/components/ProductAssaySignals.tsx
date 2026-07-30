"use client";

import Link from "next/link";
import {
  getProductAssaySignals,
  type ProductAssaySignals as AssaySignals,
} from "@/data/coa";

type ProductAssaySignalsProps = {
  productSlug: string;
  /** Compact layout for catalog cards; default is product-detail. */
  variant?: "detail" | "card";
};

function LabName({
  name,
  url,
}: {
  name: string;
  url: string | null;
}) {
  if (!url) {
    return <>{name}</>;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-line underline-offset-4 transition hover:decoration-ink"
      onClick={(event) => event.stopPropagation()}
    >
      {name}
    </a>
  );
}

function signalParts(signals: AssaySignals): string[] {
  const parts: string[] = [];
  if (signals.purity) {
    parts.push(`${signals.purity} purity`);
  }
  if (signals.testMethods) {
    parts.push(signals.testMethods);
  }
  return parts;
}

export function ProductAssaySignals({
  productSlug,
  variant = "detail",
}: ProductAssaySignalsProps) {
  const signals = getProductAssaySignals(productSlug);
  const parts = signalParts(signals);
  const isCard = variant === "card";

  return (
    <div
      className={
        isCard
          ? "mt-3 space-y-1.5 text-[0.7rem] leading-snug text-ink-soft"
          : "mt-6 space-y-2"
      }
      data-assay={signals.hasPublishedCoa ? "published" : "on-request"}
    >
      {!isCard ? (
        <p className="label !text-ink-soft">Assay</p>
      ) : null}

      {parts.length > 0 ? (
        <p
          className={
            isCard
              ? "font-semibold uppercase tracking-[0.12em] text-ink"
              : "text-sm font-semibold tabular-nums tracking-tight text-ink"
          }
        >
          {parts.join(" · ")}
        </p>
      ) : null}

      {signals.testingLabName ? (
        <p className={isCard ? undefined : "text-sm leading-relaxed text-ink-soft"}>
          {signals.hasPublishedCoa ? "Third-party lab: " : "Analytical partner: "}
          <LabName
            name={signals.testingLabName}
            url={signals.testingLabUrl}
          />
        </p>
      ) : null}

      {signals.coaNote && !isCard ? (
        <p className="text-xs text-ink-soft">{signals.coaNote}</p>
      ) : null}

      <div
        className={
          isCard
            ? "flex flex-wrap items-center gap-x-3 gap-y-1"
            : "flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-6"
        }
      >
        {signals.coaHref ? (
          <a
            href={signals.coaHref}
            target="_blank"
            rel="noopener noreferrer"
            className={
              isCard
                ? "font-semibold uppercase tracking-[0.14em] text-accent underline decoration-line underline-offset-4 transition hover:text-ink hover:decoration-ink"
                : "link-underline text-xs font-semibold uppercase tracking-[0.16em] text-ink"
            }
            onClick={(event) => event.stopPropagation()}
          >
            {isCard ? "COA PDF →" : "View certificate (PDF) →"}
          </a>
        ) : (
          <Link
            href="/coa"
            className={
              isCard
                ? "font-semibold uppercase tracking-[0.14em] text-ink-soft underline decoration-line underline-offset-4 transition hover:text-ink hover:decoration-ink"
                : "link-underline text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft"
            }
            onClick={(event) => event.stopPropagation()}
          >
            {isCard ? "COA on request →" : "Request certificate →"}
          </Link>
        )}
        {!isCard ? (
          <Link
            href="/coa"
            className="link-underline text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft"
          >
            Assay policy →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
