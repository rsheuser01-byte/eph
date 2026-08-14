export type ShippingAddress = {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type AddressSuggestion = {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
};

export type AddressVerification =
  | { ok: true; enabled: false; billing: ShippingAddress }
  | {
      ok: true;
      enabled: true;
      formatted: string;
      billing: ShippingAddress;
    }
  | { ok: false; enabled: true; error: string };

export class AddressVerificationError extends Error {
  constructor(message = "Unable to verify shipping address.") {
    super(message);
    this.name = "AddressVerificationError";
  }
}

const PREMISE_GRANULARITY = new Set([
  "PREMISE",
  "SUB_PREMISE",
  "PREMISE_PROXIMITY",
]);

const UNVERIFIED_MESSAGE =
  "We couldn't verify that shipping address. Check the street, city, state, and ZIP so your package can be delivered.";

type PlacePrediction = {
  placeId?: string;
  text?: { text?: string };
  structuredFormat?: {
    mainText?: { text?: string };
    secondaryText?: { text?: string };
  };
};

type AutocompleteResponse = {
  suggestions?: Array<{ placePrediction?: PlacePrediction }>;
};

type PostalAddress = {
  regionCode?: string;
  postalCode?: string;
  administrativeArea?: string;
  locality?: string;
  addressLines?: string[];
};

type ValidationResponse = {
  result?: {
    verdict?: {
      addressComplete?: boolean;
      validationGranularity?: string;
    };
    address?: {
      formattedAddress?: string;
      postalAddress?: PostalAddress;
    };
  };
};

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function isGoogleAddressVerificationConfigured(): boolean {
  if (process.env.E2E_MODE === "1") {
    return false;
  }
  return Boolean(env("GOOGLE_MAPS_API_KEY"));
}

function apiKey(): string {
  const key = env("GOOGLE_MAPS_API_KEY");
  if (!key) {
    throw new AddressVerificationError();
  }
  return key;
}

async function googleErrorDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as {
      error?: { message?: string; status?: string };
    };
    return body.error?.message || body.error?.status || "unknown";
  } catch {
    return "unreadable_error_body";
  }
}

function regionCode(country: string): string {
  const value = country.trim().toUpperCase();
  if (!value || value === "US" || value === "USA" || value === "UNITED STATES") {
    return "US";
  }
  return value;
}

export function isDeliverableVerdict(input: {
  addressComplete?: boolean;
  validationGranularity?: string;
  regionCode?: string;
  locality?: string;
  administrativeArea?: string;
  postalCode?: string;
  street?: string;
}): boolean {
  if (input.regionCode && input.regionCode.toUpperCase() !== "US") {
    return false;
  }
  if (!input.addressComplete) {
    return false;
  }
  if (
    !input.validationGranularity ||
    !PREMISE_GRANULARITY.has(input.validationGranularity)
  ) {
    return false;
  }
  return Boolean(
    input.locality &&
      input.administrativeArea &&
      input.postalCode &&
      input.street,
  );
}

export async function suggestAddresses(
  query: string,
): Promise<{ enabled: boolean; suggestions: AddressSuggestion[] }> {
  const trimmed = query.trim();
  if (!isGoogleAddressVerificationConfigured()) {
    return { enabled: false, suggestions: [] };
  }
  if (trimmed.length < 3) {
    return { enabled: true, suggestions: [] };
  }

  const response = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey(),
      },
      body: JSON.stringify({
        input: trimmed,
        includedRegionCodes: ["us"],
        languageCode: "en",
      }),
    },
  );

  if (!response.ok) {
    const detail = await googleErrorDetail(response);
    console.error("[address] Places autocomplete failed", response.status, detail);
    throw new AddressVerificationError();
  }

  const data = (await response.json()) as AutocompleteResponse;
  const suggestions: AddressSuggestion[] = [];
  for (const item of data.suggestions ?? []) {
    const prediction = item.placePrediction;
    if (!prediction) {
      continue;
    }
    const placeId = prediction.placeId?.trim();
    const text = prediction.text?.text?.trim();
    if (!placeId || !text) {
      continue;
    }
    suggestions.push({
      placeId,
      text,
      mainText: prediction.structuredFormat?.mainText?.text?.trim() || text,
      secondaryText:
        prediction.structuredFormat?.secondaryText?.text?.trim() || "",
    });
    if (suggestions.length >= 6) {
      break;
    }
  }
  return { enabled: true, suggestions };
}

function billingFromPostal(
  postal: PostalAddress,
  address2?: string,
): ShippingAddress | null {
  const addressLines = (postal.addressLines ?? [])
    .map((line) => line.trim())
    .filter(Boolean);
  const street = addressLines[0];
  const city = postal.locality?.trim();
  const state = postal.administrativeArea?.trim();
  const zip = postal.postalCode?.trim();
  if (!street || !city || !state || !zip) {
    return null;
  }
  if ((postal.regionCode ?? "US").toUpperCase() !== "US") {
    return null;
  }

  const unit = addressLines.slice(1).join(", ");
  return {
    address1: street,
    address2: unit || address2?.trim() || undefined,
    city,
    state,
    zip,
    country: "US",
  };
}

export async function verifyShippingAddress(
  input: ShippingAddress,
): Promise<AddressVerification> {
  if (!isGoogleAddressVerificationConfigured()) {
    return { ok: true, enabled: false, billing: input };
  }

  const addressLines = [input.address1.trim(), input.address2?.trim()].filter(
    (line): line is string => Boolean(line),
  );
  if (addressLines.length === 0) {
    return { ok: false, enabled: true, error: UNVERIFIED_MESSAGE };
  }

  const response = await fetch(
    `https://addressvalidation.googleapis.com/v1:validateAddress?key=${encodeURIComponent(apiKey())}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: {
          regionCode: regionCode(input.country),
          locality: input.city.trim() || undefined,
          administrativeArea: input.state.trim() || undefined,
          postalCode: input.zip.trim() || undefined,
          addressLines,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await googleErrorDetail(response);
    console.error("[address] Address Validation failed", response.status, detail);
    throw new AddressVerificationError();
  }

  const data = (await response.json()) as ValidationResponse;
  const result = data.result;
  const postal = result?.address?.postalAddress;
  const street = postal?.addressLines?.[0]?.trim();
  if (
    !result ||
    !postal ||
    !isDeliverableVerdict({
      addressComplete: result.verdict?.addressComplete,
      validationGranularity: result.verdict?.validationGranularity,
      regionCode: postal.regionCode,
      locality: postal.locality,
      administrativeArea: postal.administrativeArea,
      postalCode: postal.postalCode,
      street,
    })
  ) {
    return { ok: false, enabled: true, error: UNVERIFIED_MESSAGE };
  }

  const billing = billingFromPostal(postal, input.address2);
  if (!billing) {
    return { ok: false, enabled: true, error: UNVERIFIED_MESSAGE };
  }

  return {
    ok: true,
    enabled: true,
    formatted:
      result.address?.formattedAddress?.trim() ||
      `${billing.address1}, ${billing.city}, ${billing.state} ${billing.zip}`,
    billing,
  };
}
