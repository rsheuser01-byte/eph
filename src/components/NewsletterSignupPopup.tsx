"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  WELCOME_PROMO_CODE,
  WELCOME_PROMO_DISCOUNT_LABEL,
} from "@/lib/email/marketing/welcomeEmail";
import { AGE_VERIFIED_KEY } from "@/components/AgeGate";

export const NEWSLETTER_DISMISSED_KEY = "eph-newsletter-dismissed";
export const NEWSLETTER_SUBSCRIBED_KEY = "eph-newsletter-subscribed";

/** After age gate — short enough to notice, long enough to not feel pushy. */
const SHOW_DELAY_MS = 5_000;
const AGE_POLL_MS = 400;
const THANKS_HIDE_MS = 4_000;

type FormStatus = "idle" | "submitting" | "done" | "error";

function readLocalFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeLocalFlag(key: string): void {
  try {
    window.localStorage.setItem(key, "true");
  } catch {
    // Session-only if storage is blocked.
  }
}

function readSessionFlag(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function writeSessionFlag(key: string): void {
  try {
    window.sessionStorage.setItem(key, "true");
  } catch {
    // Ignore if storage is blocked.
  }
}

function isAgeVerified(): boolean {
  try {
    return window.sessionStorage.getItem(AGE_VERIFIED_KEY) === "true";
  } catch {
    return false;
  }
}

function shouldNeverShow(): boolean {
  // Subscribed = forever. Dismissed = this browser session only.
  return (
    readLocalFlag(NEWSLETTER_SUBSCRIBED_KEY) ||
    readSessionFlag(NEWSLETTER_DISMISSED_KEY)
  );
}

/**
 * Discrete homepage-only newsletter card. Shows after age gate clears + 12s.
 * Does not lock scroll or use a full-screen overlay.
 */
export function NewsletterSignupPopup() {
  const titleId = useId();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const hideThanksTimer = useRef<number | null>(null);

  useEffect(() => {
    // Clear legacy forever-dismiss from earlier builds.
    try {
      window.localStorage.removeItem(NEWSLETTER_DISMISSED_KEY);
    } catch {
      // Ignore.
    }

    if (shouldNeverShow()) {
      return;
    }

    let cancelled = false;
    let delayTimer: number | undefined;
    let pollTimer: number | undefined;

    function reveal() {
      if (!cancelled && !shouldNeverShow()) {
        setVisible(true);
      }
    }

    function startDelay() {
      delayTimer = window.setTimeout(reveal, SHOW_DELAY_MS);
    }

    function onAgeReady() {
      if (pollTimer !== undefined) {
        window.clearInterval(pollTimer);
        pollTimer = undefined;
      }
      startDelay();
    }

    if (isAgeVerified()) {
      startDelay();
    } else {
      pollTimer = window.setInterval(() => {
        if (isAgeVerified()) {
          onAgeReady();
        }
      }, AGE_POLL_MS);
    }

    return () => {
      cancelled = true;
      if (delayTimer !== undefined) {
        window.clearTimeout(delayTimer);
      }
      if (pollTimer !== undefined) {
        window.clearInterval(pollTimer);
      }
    };
  }, []);

  const dismiss = useCallback(() => {
    writeSessionFlag(NEWSLETTER_DISMISSED_KEY);
    // Clear legacy forever-dismiss so older visits don't block the popup.
    try {
      window.localStorage.removeItem(NEWSLETTER_DISMISSED_KEY);
    } catch {
      // Ignore.
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dismiss();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, dismiss]);

  useEffect(() => {
    return () => {
      if (hideThanksTimer.current !== null) {
        window.clearTimeout(hideThanksTimer.current);
      }
    };
  }, []);

  function markSubscribedAndHide() {
    writeLocalFlag(NEWSLETTER_SUBSCRIBED_KEY);
    hideThanksTimer.current = window.setTimeout(() => {
      setVisible(false);
    }, THANKS_HIDE_MS);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") {
      return;
    }
    setStatus("submitting");
    setError(null);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName: "" }),
      });

      if (!response.ok) {
        setStatus("error");
        setError("We couldn't complete your signup. Please try again.");
        return;
      }

      setEmail("");
      setStatus("done");
      markSubscribedAndHide();
    } catch {
      setStatus("error");
      setError("We couldn't complete your signup. Please try again.");
    }
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      className="animate-rise fixed bottom-4 end-4 z-[80] w-[min(100%-2rem,22rem)] border border-line bg-bg-elevated p-5 shadow-[0_18px_48px_rgba(0,0,0,0.45)] surface-grain"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <div className="relative z-[2]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label">Newsletter</p>
            <h2
              id={titleId}
              className="font-display mt-2 text-xl font-semibold tracking-tight text-ink"
            >
              Lab updates
            </h2>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 px-1 text-lg leading-none text-ink-soft transition hover:text-ink"
            aria-label="Dismiss newsletter signup"
          >
            ×
          </button>
        </div>

        {status === "done" ? (
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            You&apos;re subscribed! Check your inbox for your welcome email.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Occasional product availability and research notes — subscribers
              get {WELCOME_PROMO_DISCOUNT_LABEL} with {WELCOME_PROMO_CODE}.
            </p>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <label className="block">
                <span className="sr-only">Email</span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="you@lab.org"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={status === "submitting"}
                  className="w-full border-0 border-b border-line bg-transparent px-0 py-2 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-ink disabled:opacity-50"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={status === "submitting" || email.trim().length === 0}
                  className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "submitting" ? "Joining…" : "Subscribe"}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft transition hover:text-ink"
                >
                  No thanks
                </button>
              </div>
              <p className="text-[0.7rem] leading-relaxed text-ink-soft">
                By subscribing you agree to receive marketing email. See our{" "}
                <Link href="/privacy" className="link-underline">
                  Privacy
                </Link>{" "}
                policy. Unsubscribe anytime.
              </p>
              {error ? (
                <p className="text-xs text-ink-soft" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
