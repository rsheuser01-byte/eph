import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CANONICAL_PRODUCTION_ORIGIN,
  canonicalizeSiteUrl,
  getSiteUrl,
} from "./siteUrl";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("canonicalizeSiteUrl", () => {
  it("rewrites bare production host to www", () => {
    expect(canonicalizeSiteUrl("https://elevateprecisionhealth.com")).toBe(
      CANONICAL_PRODUCTION_ORIGIN,
    );
    expect(
      canonicalizeSiteUrl("https://elevateprecisionhealth.com/"),
    ).toBe(CANONICAL_PRODUCTION_ORIGIN);
  });

  it("leaves www production host unchanged", () => {
    expect(canonicalizeSiteUrl(CANONICAL_PRODUCTION_ORIGIN)).toBe(
      CANONICAL_PRODUCTION_ORIGIN,
    );
  });

  it("leaves non-production hosts unchanged", () => {
    expect(canonicalizeSiteUrl("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
    expect(canonicalizeSiteUrl("https://example.com")).toBe(
      "https://example.com",
    );
  });
});

describe("getSiteUrl", () => {
  it("canonicalizes NEXT_PUBLIC_SITE_URL when bare production host is set", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SITE_URL",
      "https://elevateprecisionhealth.com",
    );
    expect(getSiteUrl()).toBe(CANONICAL_PRODUCTION_ORIGIN);
  });

  it("returns www when NEXT_PUBLIC_SITE_URL is already canonical", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", CANONICAL_PRODUCTION_ORIGIN);
    expect(getSiteUrl()).toBe(CANONICAL_PRODUCTION_ORIGIN);
  });
});
