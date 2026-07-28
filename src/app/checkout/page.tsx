"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { formatUSD, orderTotals } from "@/lib/checkout/pricing";

const inputClass =
  "w-full border border-line bg-panel px-4 py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
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
  const { lines, resolved, subtotal, clear } = useCart();
  const { shipping, total } = orderTotals(subtotal);
  const tax = 0;
  const provider = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? "mock").toLowerCase();
  const requiresCard = provider !== "bankful-hpp" && provider !== "mock-hpp";
  const isHosted = !requiresCard;

  const [form, setForm] = useState(initialForm);
  const [researchAck, setResearchAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = checkoutErrorMessage(searchParams.get("error"));
    if (fromQuery) {
      setError(fromQuery);
    }
  }, [searchParams]);

  function update(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
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
          items: lines,
          customer: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
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
              I confirm this purchase is for research use only by a qualified
              researcher for laboratory use, not for human or veterinary use.
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
          <div className="mt-6 flex items-center justify-between border-t border-line pt-5 text-sm text-ink-soft">
            <span>Subtotal</span>
            <span className="tabular-nums text-ink">{formatUSD(subtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-ink-soft">
            <span>Shipping</span>
            <span className="tabular-nums text-ink">
              {shipping === 0 ? "Free" : formatUSD(shipping)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-ink-soft">
            <span>Tax</span>
            <span className="tabular-nums text-ink">{formatUSD(tax)}</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="font-display text-lg font-semibold text-ink">
              Total
            </span>
            <span className="font-display text-lg font-semibold tabular-nums text-ink">
              {formatUSD(total + tax)}
            </span>
          </div>
          <button
            type="submit"
            disabled={submitting || !researchAck}
            className="btn btn-primary btn-arrow mt-7 w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Processing…"
              : isHosted
                ? "Continue to secure payment"
                : `Pay ${formatUSD(total + tax)}`}
          </button>
          {isHosted ? (
            <p className="mt-4 text-[0.7rem] leading-relaxed text-ink-soft/80">
              You will complete payment on Bankful’s secure page, then return
              here for order status.
            </p>
          ) : (
            <p className="mt-4 text-[0.7rem] leading-relaxed text-ink-soft/80">
              Research use only. By ordering you confirm you are a qualified
              researcher purchasing for laboratory use.
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
