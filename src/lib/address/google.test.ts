import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isDeliverableVerdict,
  isGoogleAddressVerificationConfigured,
  suggestAddresses,
  verifyShippingAddress,
} from "./google";

const sampleInput = {
  address1: "1 Lab St",
  city: "Louisville",
  state: "KY",
  zip: "40202",
  country: "US",
};

describe("isGoogleAddressVerificationConfigured", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is off when the API key is missing", () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    expect(isGoogleAddressVerificationConfigured()).toBe(false);
  });

  it("is on when the API key is set", () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
    expect(isGoogleAddressVerificationConfigured()).toBe(true);
  });

  it("stays off during E2E even with a key", () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
    vi.stubEnv("E2E_MODE", "1");
    expect(isGoogleAddressVerificationConfigured()).toBe(false);
  });
});

describe("isDeliverableVerdict", () => {
  const valid = {
    addressComplete: true,
    validationGranularity: "PREMISE",
    regionCode: "US",
    locality: "Louisville",
    administrativeArea: "KY",
    postalCode: "40202",
    street: "1 Lab St",
  };

  it("accepts a complete US premise", () => {
    expect(isDeliverableVerdict(valid)).toBe(true);
  });

  it("rejects street-only matches", () => {
    expect(
      isDeliverableVerdict({ ...valid, validationGranularity: "ROUTE" }),
    ).toBe(false);
  });

  it("rejects incomplete addresses", () => {
    expect(isDeliverableVerdict({ ...valid, addressComplete: false })).toBe(
      false,
    );
  });

  it("rejects non-US addresses", () => {
    expect(isDeliverableVerdict({ ...valid, regionCode: "CA" })).toBe(false);
  });
});

describe("suggestAddresses", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("returns disabled with no suggestions when unconfigured", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    await expect(suggestAddresses("123 Main")).resolves.toEqual({
      enabled: false,
      suggestions: [],
    });
  });

  it("does not call Google for short queries", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(suggestAddresses("12")).resolves.toEqual({
      enabled: true,
      suggestions: [],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps Places autocomplete predictions", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            placePrediction: {
              placeId: "ChIJ123",
              text: { text: "1 Lab St, Louisville, KY, USA" },
              structuredFormat: {
                mainText: { text: "1 Lab St" },
                secondaryText: { text: "Louisville, KY, USA" },
              },
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await suggestAddresses("1 Lab");
    expect(result.enabled).toBe(true);
    expect(result.suggestions).toEqual([
      {
        placeId: "ChIJ123",
        text: "1 Lab St, Louisville, KY, USA",
        mainText: "1 Lab St",
        secondaryText: "Louisville, KY, USA",
      },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe("verifyShippingAddress", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("passes through the input when Google is not configured", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    await expect(verifyShippingAddress(sampleInput)).resolves.toEqual({
      ok: true,
      enabled: false,
      billing: sampleInput,
    });
  });

  it("returns standardized fields for a deliverable address", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            verdict: {
              addressComplete: true,
              validationGranularity: "PREMISE",
            },
            address: {
              formattedAddress: "1 Lab Street, Louisville, KY 40202, USA",
              postalAddress: {
                regionCode: "US",
                locality: "Louisville",
                administrativeArea: "KY",
                postalCode: "40202",
                addressLines: ["1 Lab Street"],
              },
            },
          },
        }),
      }),
    );

    const result = await verifyShippingAddress(sampleInput);
    expect(result).toEqual({
      ok: true,
      enabled: true,
      formatted: "1 Lab Street, Louisville, KY 40202, USA",
      billing: {
        address1: "1 Lab Street",
        address2: undefined,
        city: "Louisville",
        state: "KY",
        zip: "40202",
        country: "US",
      },
    });
  });

  it("rejects an address Google cannot confirm at premise level", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          result: {
            verdict: {
              addressComplete: false,
              validationGranularity: "ROUTE",
            },
            address: {
              formattedAddress: "Main Street, Louisville, KY, USA",
              postalAddress: {
                regionCode: "US",
                locality: "Louisville",
                administrativeArea: "KY",
                postalCode: "40202",
                addressLines: ["Main Street"],
              },
            },
          },
        }),
      }),
    );

    const result = await verifyShippingAddress({
      ...sampleInput,
      address1: "asdf",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/couldn't verify/i);
    }
  });
});
