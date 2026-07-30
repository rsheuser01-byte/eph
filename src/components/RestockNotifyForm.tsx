"use client";

import { useState, type FormEvent } from "react";

type RestockNotifyFormProps = {
  productSlug: string;
  productName: string;
  sku: string;
  size: string;
};

type FormStatus = "idle" | "submitting" | "done" | "error";

/**
 * Replaces the dead disabled "Out of stock" CTA with an email capture.
 * Does not show a restock date — none is known in catalog data.
 */
export function RestockNotifyForm({
  productSlug,
  productName,
  sku,
  size,
}: RestockNotifyFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/stock-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          productSlug,
          sku,
          size,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setStatus("error");
        setError(
          payload?.error ??
            "Could not save your request. Please try again.",
        );
        return;
      }

      setStatus("done");
    } catch {
      setStatus("error");
      setError("Could not save your request. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="mt-6 border border-line bg-bg-elevated px-4 py-4">
        <p className="text-sm font-medium text-ink">
          You&apos;re on the list for {productName} {size}.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft">
          We&apos;ll email you when this size is back in stock.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <p className="text-sm font-medium text-ink">Currently out of stock</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
          Leave your email and we&apos;ll notify you when {productName}{" "}
          {size} is available again.
        </p>
      </div>
      <label className="block">
        <span className="label">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={status === "submitting"}
          className="mt-3 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-sm outline-none transition focus:border-ink disabled:opacity-50"
        />
      </label>
      <button
        type="submit"
        disabled={status === "submitting" || email.trim().length === 0}
        className="btn btn-primary btn-arrow w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {status === "submitting" ? "Saving…" : "Notify me when back"}
      </button>
      {error ? (
        <p className="text-xs text-ink-soft" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
