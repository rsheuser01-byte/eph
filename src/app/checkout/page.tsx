"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { formatUSD, orderTotals } from "@/lib/checkout/pricing";
import { researchUseAttestationText } from "@/data/site";

const inputClass =
  "w-full border border-line bg-panel px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  organization: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
  cardNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cvv: "",
};

function checkoutErrorMessage(code: string | null): string | null {
  switch (code) {
    case "payment_failed":
      return "Payment was not completed. No confirmed charge was recorded. Your cart is still available — you can try again.";
    case "payment_cancelled":
      return "Payment was cancelled. No confirmed charge was recorded. Your cart is still available — you can try again.";
    case "missing_order":
    case "unknown_order":
      return "We could not find that checkout session. Please try again.";
    case "inventory_commit_failed":
      return "Payment may have succeeded but inventory needs review. Contact support with your order details.";
    default:
      return code ? "Checkout could not continue. Please try again." : null;
  }
}

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolved, subtotal, clear } = useCart();
  const catalogItems = useMemo(
    () =>
      resolved.map(({ line }) => ({
        slug: line.slug,
        size: line.size,
        qty: line.qty,
      })),
    [resolved],
  );
  const baseTotals = orderTotals(subtotal);
  const provider = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? "mock").toLowerCase();
  const requiresCard = provider !== "bankful-hpp" && provider !== "mock-hpp";
  const isHosted = !requiresCard;

  const [form, setForm] = useState(initialForm);
  const [researchAck, setResearchAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tax, setTax] = useState(0);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxError, setTaxError] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    label: string;
    discount: number;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoApplying, setPromoApplying] = useState(false);
  const discount = appliedPromo?.discount ?? 0;
  const displayTotals = orderTotals(subtotal, tax, discount);
  const displayTotal = displayTotals.total;

  useEffect(() => {
    const fromQuery = checkoutErrorMessage(searchParams.get("error"));
    if (fromQuery) {
      setError(fromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    const addressReady =
      form.address1.trim() &&
      form.city.trim() &&
      form.state.trim() &&
      form.zip.trim() &&
      catalogItems.length > 0;
    if (!addressReady) {
      setTax(0);
      setTaxError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setTaxLoading(true);
      setTaxError(null);
      try {
        const response = await fetch("/api/checkout/tax", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            items: catalogItems,
            email: form.email,
            ...(appliedPromo ? { promoCode: appliedPromo.code } : {}),
            customer: {
              address1: form.address1,
              city: form.city,
              state: form.state,
              zip: form.zip,
              country: form.country || "US",
              email: form.email,
            },
          }),
        });
        const data = (await response.json()) as {
          tax?: number;
          discount?: number;
          promoCode?: string | null;
          label?: string | null;
          error?: string;
        };
        if (!response.ok) {
          setTax(0);
          setTaxError(data.error ?? "Unable to calculate tax.");
          return;
        }
        setTax(typeof data.tax === "number" ? data.tax : 0);
        if (
          appliedPromo &&
          typeof data.discount === "number" &&
          data.promoCode
        ) {
          setAppliedPromo({
            code: data.promoCode,
            label: data.label ?? appliedPromo.label,
            discount: data.discount,
          });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        setTax(0);
        setTaxError("Unable to calculate tax.");
      } finally {
        setTaxLoading(false);
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [
    form.address1,
    form.city,
    form.state,
    form.zip,
    form.country,
    form.email,
    catalogItems,
    appliedPromo?.code,
  ]);

  function update(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function applyPromo() {
    const code = promoInput.trim();
    if (!code) {
      setPromoError("Enter a promo code.");
      return;
    }
    setPromoApplying(true);
    setPromoError(null);
    try {
      const response = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: code,
          email: form.email,
          items: catalogItems,
        }),
      });
      const data = (await response.json()) as {
        promoCode?: string;
        label?: string;
        discount?: number;
        error?: string;
      };
      if (!response.ok || typeof data.discount !== "number" || !data.promoCode) {
        setAppliedPromo(null);
        setPromoError(data.error ?? "Invalid promo code.");
        return;
      }
      setAppliedPromo({
        code: data.promoCode,
        label: data.label ?? data.promoCode,
        discount: data.discount,
      });
      setPromoInput(data.promoCode);
    } catch {
      setPromoError("Unable to validate promo code. Please try again.");
    } finally {
      setPromoApplying(false);
    }
  }

  function clearPromo() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!researchAck) {
      setError(
        "Please confirm research-use-only acknowledgment before continuing.",
      );
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: catalogItems,
          researchUseAcknowledged: researchAck,
          ...(appliedPromo ? { promoCode: appliedPromo.code } : {}),
            customer: {
              firstName: form.firstName,
              lastName: form.lastName,
              email: form.email,
              phone: form.phone,
              organization: form.organization,
              address1: form.address1,
              address2: form.address2,
              city: form.city,
              state: form.state,
              zip: form.zip,
              country: form.country,
            },
          ...(requiresCard
            ? {
                card: {
                  number: form.cardNumber,
                  expiryMonth: form.expiryMonth,
                  expiryYear: form.expiryYear,
                  cvv: form.cvv,
                },
              }
            : {}),
        }),
      });

      const data = (await response.json()) as {
        status?: string;
        orderId?: string;
        lookupToken?: string;
        redirectUrl?: string;
        error?: string;
      };

      if (data.redirectUrl) {
        // Keep cart until payment is confirmed on the success page.
        window.location.href = data.redirectUrl;
        return;
      }

      if (!response.ok || data.status !== "approved") {
        setError(data.error ?? "Payment could not be completed.");
        return;
      }

      clear();
      const params = new URLSearchParams({
        order: data.orderId ?? "",
      });
      if (data.lookupToken) {
        params.set("token", data.lookupToken);
      }
      router.push(`/checkout/success?${params.toString()}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (resolved.length === 0) {
    return (
      <div className="site-shell py-20">
        <p className="label">Checkout</p>
        <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
          Your cart is empty
        </h1>
        <Link href="/products" className="btn btn-primary btn-arrow mt-10">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="site-shell py-20">
      <p className="label">Checkout</p>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
        Complete your order
      </h1>

      <form
        onSubmit={handleSubmit}
        className="mt-14 grid gap-14 lg:grid-cols-[1.5fr_1fr]"
      >
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
              Shipping details
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="First name"
                autoComplete="given-name"
                required
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Last name"
                autoComplete="family-name"
                required
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
              <input
                className={inputClass}
                type="email"
                placeholder="Email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Phone (optional)"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
              <input
                className={`${inputClass} sm:col-span-2`}
                placeholder="Research Organization / Laboratory / Company (optional)"
                autoComplete="organization"
                value={form.organization}
                onChange={(e) => update("organization", e.target.value)}
              />
              <input
                className={`${inputClass} sm:col-span-2`}
                placeholder="Address"
                autoComplete="address-line1"
                required
                value={form.address1}
                onChange={(e) => update("address1", e.target.value)}
              />
              <input
                className={`${inputClass} sm:col-span-2`}
                placeholder="Apartment, suite, etc. (optional)"
                autoComplete="address-line2"
                value={form.address2}
                onChange={(e) => update("address2", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="City"
                autoComplete="address-level2"
                required
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="State"
                autoComplete="address-level1"
                required
                value={form.state}
                onChange={(e) => update("state", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="ZIP code"
                autoComplete="postal-code"
                required
                value={form.zip}
                onChange={(e) => update("zip", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Country"
                autoComplete="country"
                required
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
              />
            </div>
          </section>

          {requiresCard ? (
            <section>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                Payment
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <input
                  className={`${inputClass} sm:col-span-2`}
                  placeholder="Card number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  required
                  value={form.cardNumber}
                  onChange={(e) => update("cardNumber", e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="Exp. month (MM)"
                  inputMode="numeric"
                  autoComplete="cc-exp-month"
                  required
                  value={form.expiryMonth}
                  onChange={(e) => update("expiryMonth", e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="Exp. year (YYYY)"
                  inputMode="numeric"
                  autoComplete="cc-exp-year"
                  required
                  value={form.expiryYear}
                  onChange={(e) => update("expiryYear", e.target.value)}
                />
                <input
                  className={inputClass}
                  placeholder="CVV"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  required
                  value={form.cvv}
                  onChange={(e) => update("cvv", e.target.value)}
                />
              </div>
            </section>
          ) : (
            <section>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
                Secure payment
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Payment opens in a secure Bankful hosted page. Card details are
                entered there — not on this site.
              </p>
            </section>
          )}

          <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
            <input
              type="checkbox"
              className="mt-1"
              checked={researchAck}
              onChange={(e) => setResearchAck(e.target.checked)}
              required
            />
            <span>
              {researchUseAttestationText}{" "}
              <Link
                href="/resources/research-use-only"
                className="underline decoration-line underline-offset-4 transition hover:text-ink"
              >
                Research Use Only policy
              </Link>
              .
            </span>
          </label>

          {error ? (
            <p className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}
        </div>

        <aside className="h-fit border border-line bg-bg-elevated p-8">
          <p className="label !text-ink">Order</p>
          <div className="mt-6 flex flex-col gap-3">
            {resolved.map(({ variant, product, line, lineTotal }) => (
              <div
                key={variant.sku}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span className="text-ink-soft">
                  {product.name} · {variant.size} × {line.qty}
                </span>
                <span className="tabular-nums text-ink">
                  {formatUSD(lineTotal)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <label className="text-sm text-ink-soft" htmlFor="promo-code">
              Promo code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="promo-code"
                type="text"
                autoComplete="off"
                value={promoInput}
                disabled={Boolean(appliedPromo) || promoApplying}
                onChange={(event) => {
                  setPromoInput(event.target.value);
                  setPromoError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    if (!appliedPromo) {
                      void applyPromo();
                    }
                  }
                }}
                className={inputClass}
                placeholder="Enter code"
              />
              {appliedPromo ? (
                <button
                  type="button"
                  onClick={clearPromo}
                  className="btn shrink-0 border border-line px-4 text-sm text-ink"
                >
                  Clear
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void applyPromo()}
                  disabled={promoApplying || !promoInput.trim()}
                  className="btn btn-primary shrink-0 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {promoApplying ? "…" : "Apply"}
                </button>
              )}
            </div>
            {promoError ? (
              <p className="mt-2 text-[0.7rem] text-red-600">{promoError}</p>
            ) : appliedPromo ? (
              <p className="mt-2 text-[0.7rem] text-ink-soft">
                {appliedPromo.label} applied
              </p>
            ) : null}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-line pt-5 text-sm text-ink-soft">
            <span>Subtotal</span>
            <span className="tabular-nums text-ink">{formatUSD(subtotal)}</span>
          </div>
          {appliedPromo ? (
            <div className="mt-2 flex items-center justify-between text-sm text-ink-soft">
              <span>Discount ({appliedPromo.code})</span>
              <span className="tabular-nums text-ink">
                −{formatUSD(discount)}
              </span>
            </div>
          ) : null}
          <div className="mt-2 flex items-center justify-between text-sm text-ink-soft">
            <span>Shipping</span>
            <span className="tabular-nums text-ink">
              {baseTotals.shipping === 0 ? "Free" : formatUSD(baseTotals.shipping)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-ink-soft">
            <span>Tax</span>
            <span className="tabular-nums text-ink">
              {taxLoading ? "…" : formatUSD(tax)}
            </span>
          </div>
          {taxError ? (
            <p className="mt-2 text-[0.7rem] text-red-600">{taxError}</p>
          ) : (
            <p className="mt-2 text-[0.7rem] text-ink-soft/80">
              Tax is calculated from your shipping address and confirmed at
              payment.
            </p>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="font-display text-lg font-semibold text-ink">
              Total
            </span>
            <span className="font-display text-lg font-semibold tabular-nums text-ink">
              {formatUSD(displayTotal)}
            </span>
          </div>
          <button
            type="submit"
            disabled={submitting || !researchAck || Boolean(taxError)}
            className="btn btn-primary btn-arrow mt-7 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Processing…"
              : isHosted
                ? "Continue to secure payment"
                : `Pay ${formatUSD(displayTotal)}`}
          </button>
          {isHosted ? (
            <p className="mt-4 text-[0.7rem] leading-relaxed text-ink-soft/80">
              You will complete payment on Bankful’s secure page, then return
              here for order status.
            </p>
          ) : (
            <p className="mt-4 text-[0.7rem] leading-relaxed text-ink-soft/80">
              Research use only. By ordering you certify these materials are for
              legitimate laboratory research and will not be administered to
              humans or animals.
            </p>
          )}
        </aside>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="site-shell py-20">
          <p className="text-sm text-ink-soft">Loading checkout…</p>
        </div>
      }
    >
      <CheckoutForm />
    </Suspense>
  );
}
