"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  sku: string;
};

export function AdminInventoryAdjust({ sku }: Props) {
  const router = useRouter();
  const [delta, setDelta] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(reason: "receive" | "manual_adjust") {
    setPending(true);
    setError(null);
    const value = Number(delta);
    if (!Number.isFinite(value) || value === 0) {
      setError("Enter a non-zero quantity.");
      setPending(false);
      return;
    }
    try {
      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku,
          delta: reason === "receive" ? Math.abs(value) : value,
          reason,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        value={delta}
        onChange={(event) => setDelta(event.target.value)}
        className="w-20 border border-line bg-panel px-2 py-1 text-sm tabular-nums"
        aria-label={`Adjust quantity for ${sku}`}
      />
      <button
        type="button"
        disabled={pending}
        className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-accent"
        onClick={() => submit("receive")}
      >
        Receive
      </button>
      <button
        type="button"
        disabled={pending}
        className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-soft"
        onClick={() => submit("manual_adjust")}
      >
        Adjust
      </button>
      {error ? <span className="text-xs text-red-700">{error}</span> : null}
    </div>
  );
}
