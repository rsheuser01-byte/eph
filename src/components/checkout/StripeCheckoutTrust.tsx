import Image from "next/image";

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-accent"
    >
      <path
        fill="currentColor"
        d="M17 9V7a5 5 0 0 0-10 0v2H5v12h14V9h-2Zm-8-2a3 3 0 0 1 6 0v2H9V7Zm3 7.5a1.5 1.5 0 0 1 .75 2.8V19h-1.5v-1.7A1.5 1.5 0 0 1 12 14.5Z"
      />
    </svg>
  );
}

function StripeWordmark() {
  return (
    <a
      href="https://stripe.com"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex"
    >
      <Image
        src="/payment-icons/stripe.svg"
        alt="Stripe"
        width={60}
        height={25}
        unoptimized
        className="h-5 w-auto"
      />
    </a>
  );
}

const METHODS = [
  { name: "Visa", src: "/payment-icons/visa.svg" },
  { name: "Mastercard", src: "/payment-icons/mastercard.svg" },
  { name: "American Express", src: "/payment-icons/amex.svg" },
  { name: "Discover", src: "/payment-icons/discover.svg" },
] as const;

export function AcceptedCardMarks({ compact = false }: { compact?: boolean }) {
  return (
    <ul
      className={`flex flex-wrap items-center ${compact ? "gap-1.5" : "gap-2"}`}
      aria-label="Cards accepted through Stripe: Visa, Mastercard, American Express, Discover"
    >
      {METHODS.map(({ name, src }) => (
        <li
          key={name}
          title={name}
          className="inline-flex h-[30px] w-[48px] items-center justify-center rounded-[4px] bg-white p-1"
        >
          <Image
            src={src}
            alt={name}
            width={40}
            height={22}
            unoptimized
            className="h-[22px] w-[40px] object-contain"
          />
        </li>
      ))}
    </ul>
  );
}

export function StripeCheckoutTrust({ preview = false }: { preview?: boolean }) {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
        Secure payment
      </h2>
      <div className="mt-5 flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
        <LockIcon />
        <p>
          {preview
            ? "Live checkout sends you to Stripe’s encrypted page to enter card details. This test environment does not open Stripe."
            : "You’ll finish on Stripe’s encrypted checkout page. Card numbers stay with Stripe — we never see or store them on this site."}
        </p>
      </div>
      <div className="mt-5">
        <AcceptedCardMarks />
        <p className="mt-2 text-[0.7rem] text-ink-soft/80">
          Apple Pay and Google Pay also appear on Stripe when your device
          supports them.
        </p>
      </div>
      <p className="mt-4 inline-flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink-soft">
        Powered by
        <StripeWordmark />
      </p>
    </section>
  );
}

export function StripeCheckoutCtaTrust() {
  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[0.7rem] leading-relaxed text-ink-soft">
        <LockIcon />
          <span>Encrypted checkout · PCI DSS Level 1 · cards never touch our servers</span>
      </div>
      <AcceptedCardMarks compact />
      <p className="inline-flex items-center gap-2 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-ink-soft/80">
        Powered by
        <StripeWordmark />
      </p>
    </div>
  );
}
