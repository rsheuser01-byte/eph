"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { formatUSD } from "@/lib/checkout/pricing";
import { promoWindowStatus } from "@/lib/promo/eligibility";
import type { PromoCode } from "@/lib/promo/types";

const STATUS_LABEL = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  cancelled: "Cancelled",
} as const;

function discountLabel(promo: PromoCode): string {
  if (typeof promo.percentOff === "number") {
    return `${promo.percentOff}% off`;
  }
  if (typeof promo.amountOff === "number") {
    return `${formatUSD(promo.amountOff)} off`;
  }
  return promo.label;
}

function when(value: string | undefined): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

function toIso(localValue: string): string | null {
  if (!localValue) {
    return null;
  }
  const parsed = new Date(localValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

export function AdminPromoCodes({ promos }: { promos: PromoCode[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState("25");
  const [label, setLabel] = useState("");
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function post(body: Record<string, unknown>, resetForm: boolean) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not save the promo code.");
        return;
      }
      if (resetForm) {
        setCode("");
        setLabel("");
        setStartsAt("");
        setEndsAt("");
        setFirstOrderOnly(false);
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const amount = Number(value);
    void post(
      {
        code,
        percentOff: kind === "percent" ? amount : null,
        amountOff: kind === "amount" ? amount : null,
        label,
        firstOrderOnly,
        startsAt: toIso(startsAt),
        endsAt: toIso(endsAt),
      },
      true,
    );
  }

  return (
    <div className="mt-12 space-y-14">
      <form onSubmit={save} className="max-w-xl space-y-4 border-t border-line pt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">New or updated code</h2>
        <p className="text-sm text-ink-soft">
          Saving an existing code updates its discount and dates and turns it back on.
          Leave the dates blank if it should work until you cancel it.
        </p>
        <label className="block text-sm text-ink-soft">
          Code
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
            className="mt-1 w-full border border-line bg-panel px-3 py-2 text-sm uppercase text-ink"
            autoComplete="off"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="text-sm text-ink-soft">
            Discount
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
              className="mt-1 w-28 border border-line bg-panel px-3 py-2 text-sm tabular-nums text-ink"
            />
          </label>
          <label className="text-sm text-ink-soft">
            Type
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as "percent" | "amount")}
              className="mt-1 block border border-line bg-panel px-3 py-2 text-sm text-ink"
            >
              <option value="percent">Percent off</option>
              <option value="amount">Dollars off</option>
            </select>
          </label>
        </div>
        <label className="block text-sm text-ink-soft">
          Label (optional)
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="mt-1 w-full border border-line bg-panel px-3 py-2 text-sm text-ink"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="text-sm text-ink-soft">
            Starts
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="mt-1 block border border-line bg-panel px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="text-sm text-ink-soft">
            Ends
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              className="mt-1 block border border-line bg-panel px-3 py-2 text-sm text-ink"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={firstOrderOnly}
            onChange={(event) => setFirstOrderOnly(event.target.checked)}
          />
          First order only
        </label>
        <button
          type="submit"
          disabled={pending}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-accent"
        >
          {pending ? "Saving…" : "Save code"}
        </button>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>

      {promos.length === 0 ? (
        <p className="text-sm text-ink-soft">No promo codes yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink/20 text-[0.68rem] uppercase tracking-[0.14em] text-ink-soft">
                <th className="py-3 pr-4 font-semibold">Code</th>
                <th className="py-3 pr-4 font-semibold">Discount</th>
                <th className="py-3 pr-4 font-semibold">Starts</th>
                <th className="py-3 pr-4 font-semibold">Ends</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => {
                const status = promoWindowStatus(promo);
                return (
                  <tr key={promo.code} className="border-b border-line">
                    <td className="py-4 pr-4 font-semibold text-ink">
                      {promo.code}
                      {promo.firstOrderOnly ? (
                        <span className="mt-1 block text-xs font-normal text-ink-soft">
                          First order only
                        </span>
                      ) : null}
                    </td>
                    <td className="py-4 pr-4 text-ink">{discountLabel(promo)}</td>
                    <td className="py-4 pr-4 text-ink-soft">{when(promo.startsAt)}</td>
                    <td className="py-4 pr-4 text-ink-soft">{when(promo.endsAt)}</td>
                    <td className="py-4 pr-4 text-ink">{STATUS_LABEL[status]}</td>
                    <td className="py-4 pr-4">
                      <button
                        type="button"
                        disabled={pending}
                        className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-accent"
                        onClick={() =>
                          void post(
                            {
                              action: "set-active",
                              code: promo.code,
                              active: status === "cancelled",
                            },
                            false,
                          )
                        }
                      >
                        {status === "cancelled" ? "Turn on" : "Cancel"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
