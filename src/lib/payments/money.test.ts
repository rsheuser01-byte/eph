import { describe, expect, it } from "vitest";
import { parseAmountToCents, toCents } from "./money";

describe("toCents", () => {
  it("rounds decimal dollars to integer cents", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(1)).toBe(100);
    expect(toCents(10.999)).toBe(1100);
  });

  it("rejects non-finite values", () => {
    expect(() => toCents(Number.NaN)).toThrow(/Invalid money/);
  });
});

describe("parseAmountToCents", () => {
  it("parses Bankful TRANS_VALUE strings", () => {
    expect(parseAmountToCents("1.0000")).toBe(100);
    expect(parseAmountToCents("19.99")).toBe(1999);
  });

  it("returns null for malformed amounts", () => {
    expect(parseAmountToCents("")).toBeNull();
    expect(parseAmountToCents("abc")).toBeNull();
    expect(parseAmountToCents("1.2.3")).toBeNull();
  });
});
