"use client";

import { useEffect, useId, useRef, useState } from "react";

type AddressSuggestion = {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
};

export type AddressFormFields = {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

type SuggestionResponse = {
  enabled?: boolean;
  suggestions?: AddressSuggestion[];
  error?: string;
};

type ValidateResponse = {
  ok?: boolean;
  enabled?: boolean;
  formatted?: string;
  address?: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  error?: string;
};

type AddressFieldsProps = {
  value: AddressFormFields;
  inputClass: string;
  onChange: (field: keyof AddressFormFields, value: string) => void;
  onPatch: (patch: Partial<AddressFormFields>) => void;
  onReadyChange: (ready: boolean) => void;
};

function sameAddress(
  current: AddressFormFields,
  verified: AddressFormFields,
): boolean {
  return (
    current.address1.trim() === verified.address1.trim() &&
    current.city.trim() === verified.city.trim() &&
    current.state.trim() === verified.state.trim() &&
    current.zip.trim() === verified.zip.trim() &&
    (current.country.trim() || "US") === (verified.country.trim() || "US")
  );
}

export function AddressFields({
  value,
  inputClass,
  onChange,
  onPatch,
  onReadyChange,
}: AddressFieldsProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);
  const [pending, setPending] = useState<{
    formatted: string;
    address: AddressFormFields;
  } | null>(null);
  const [verified, setVerified] = useState<AddressFormFields | null>(null);
  const [error, setError] = useState<string | null>(null);
  const skipSuggestRef = useRef(false);
  const skipValidateRef = useRef(false);
  const verifiedRef = useRef<AddressFormFields | null>(null);

  const ready =
    googleEnabled !== true ||
    (verified !== null && sameAddress(value, verified));

  useEffect(() => {
    onReadyChange(ready);
  }, [onReadyChange, ready]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const query = value.address1.trim();
    if (skipSuggestRef.current) {
      skipSuggestRef.current = false;
      return;
    }
    if (query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/checkout/address/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ query }),
        });
        const data = (await response.json()) as SuggestionResponse;
        if (typeof data.enabled === "boolean") {
          setGoogleEnabled(data.enabled);
        }
        if (!response.ok) {
          setSuggestions([]);
          setOpen(false);
          setError(
            data.error ?? "Unable to look up addresses. Please try again.",
          );
          return;
        }
        if (!data.enabled) {
          setSuggestions([]);
          setOpen(false);
          return;
        }
        const next = data.suggestions ?? [];
        setSuggestions(next);
        setOpen(next.length > 0);
        setActiveIndex(-1);
        if (next.length > 0) {
          setError(null);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        setSuggestions([]);
        setOpen(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [value.address1]);

  useEffect(() => {
    if (skipValidateRef.current) {
      skipValidateRef.current = false;
      return;
    }
    if (googleEnabled === false) {
      setPending(null);
      setError(null);
      return;
    }
    if (verifiedRef.current && sameAddress(value, verifiedRef.current)) {
      return;
    }
    verifiedRef.current = null;
    setVerified(null);

    const complete =
      value.address1.trim() &&
      value.city.trim() &&
      value.state.trim() &&
      value.zip.trim();
    if (!complete) {
      setPending(null);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/checkout/address/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            address1: value.address1,
            address2: value.address2,
            city: value.city,
            state: value.state,
            zip: value.zip,
            country: value.country || "US",
          }),
        });
        const data = (await response.json()) as ValidateResponse;
        if (typeof data.enabled === "boolean") {
          setGoogleEnabled(data.enabled);
        }
        if (data.enabled === false) {
          setPending(null);
          setError(null);
          return;
        }
        if (!response.ok) {
          setError(data.error ?? "Unable to verify this address.");
          setPending(null);
          return;
        }
        if (!data.ok || !data.address || !data.formatted) {
          setError(
            data.error ??
              "We couldn't verify that shipping address. Check the street, city, state, and ZIP.",
          );
          setPending(null);
          return;
        }
        setError(null);
        setPending({
          formatted: data.formatted,
          address: {
            address1: data.address.address1,
            address2: data.address.address2 ?? value.address2,
            city: data.address.city,
            state: data.address.state,
            zip: data.address.zip,
            country: data.address.country || "US",
          },
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        setError("Unable to verify this address. Please try again.");
        setPending(null);
      }
    }, 450);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [
    googleEnabled,
    value.address1,
    value.address2,
    value.city,
    value.state,
    value.zip,
    value.country,
  ]);

  async function chooseSuggestion(suggestion: AddressSuggestion) {
    skipSuggestRef.current = true;
    skipValidateRef.current = true;
    setOpen(false);
    setSuggestions([]);
    setError(null);

    try {
      const response = await fetch("/api/checkout/address/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address1: suggestion.text,
          address2: value.address2,
          country: "US",
        }),
      });
      const data = (await response.json()) as ValidateResponse;
      if (typeof data.enabled === "boolean") {
        setGoogleEnabled(data.enabled);
      }
      if (!response.ok || !data.ok || !data.address || !data.formatted) {
        setError(
          data.error ??
            "We couldn't verify that shipping address. Check the street, city, state, and ZIP.",
        );
        return;
      }
      skipSuggestRef.current = true;
      skipValidateRef.current = true;
      const next: AddressFormFields = {
        address1: data.address.address1,
        address2: data.address.address2 ?? value.address2,
        city: data.address.city,
        state: data.address.state,
        zip: data.address.zip,
        country: data.address.country || "US",
      };
      onPatch(next);
      setPending({ formatted: data.formatted, address: next });
    } catch {
      setError("Unable to verify this address. Please try again.");
    }
  }

  function usePendingAddress() {
    if (!pending) {
      return;
    }
    skipSuggestRef.current = true;
    skipValidateRef.current = true;
    verifiedRef.current = pending.address;
    onPatch(pending.address);
    setVerified(pending.address);
    setPending(null);
    setError(null);
  }

  return (
    <>
      <div ref={rootRef} className="relative sm:col-span-2">
        <input
          className={inputClass}
          placeholder="Address"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          required
          value={value.address1}
          onChange={(event) => onChange("address1", event.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (!open || suggestions.length === 0) {
              return;
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) =>
                current < suggestions.length - 1 ? current + 1 : 0,
              );
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) =>
                current > 0 ? current - 1 : suggestions.length - 1,
              );
            } else if (event.key === "Enter" && activeIndex >= 0) {
              event.preventDefault();
              const suggestion = suggestions[activeIndex];
              if (suggestion) {
                void chooseSuggestion(suggestion);
              }
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {open && suggestions.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto border border-line bg-panel shadow-sm"
          >
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.placeId} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`flex w-full flex-col items-start px-4 py-3 text-left text-sm ${
                    index === activeIndex
                      ? "bg-accent/10 text-ink"
                      : "text-ink hover:bg-accent/10"
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void chooseSuggestion(suggestion)}
                >
                  <span className="font-medium">{suggestion.mainText}</span>
                  {suggestion.secondaryText ? (
                    <span className="text-ink-soft">
                      {suggestion.secondaryText}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <input
        className={`${inputClass} sm:col-span-2`}
        placeholder="Apartment, suite, etc. (optional)"
        autoComplete="address-line2"
        value={value.address2}
        onChange={(event) => onChange("address2", event.target.value)}
      />
      <input
        className={inputClass}
        placeholder="City"
        autoComplete="address-level2"
        required
        value={value.city}
        onChange={(event) => onChange("city", event.target.value)}
      />
      <input
        className={inputClass}
        placeholder="State"
        autoComplete="address-level1"
        required
        value={value.state}
        onChange={(event) => onChange("state", event.target.value)}
      />
      <input
        className={inputClass}
        placeholder="ZIP code"
        autoComplete="postal-code"
        required
        value={value.zip}
        onChange={(event) => onChange("zip", event.target.value)}
      />
      <input
        className={inputClass}
        placeholder="Country"
        autoComplete="country"
        required
        value={value.country}
        onChange={(event) => onChange("country", event.target.value)}
      />
      {pending ? (
        <div className="sm:col-span-2 border border-accent/40 bg-accent/10 px-4 py-4">
          <p className="text-sm font-medium text-ink">Use this address?</p>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {pending.formatted}
          </p>
          <button
            type="button"
            className="btn btn-primary mt-4 px-4 py-2 text-sm"
            onClick={usePendingAddress}
          >
            Use this address
          </button>
        </div>
      ) : null}
      {ready && verified && googleEnabled ? (
        <p className="sm:col-span-2 text-sm text-ink-soft">
          Address verified for shipping.
        </p>
      ) : null}
      {error ? (
        <p className="sm:col-span-2 border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </>
  );
}
