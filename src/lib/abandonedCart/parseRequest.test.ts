import { describe, expect, it } from "vitest";
import {
  parseCartSyncRequest,
  parseIdentifyRequest,
  parseRestoreRequest,
} from "./parseRequest";

describe("parseCartSyncRequest", () => {
  it("accepts valid cart lines", () => {
    const parsed = parseCartSyncRequest({
      items: [{ slug: "glp-3", size: "15mg", qty: 2 }],
    });
    expect(parsed).toEqual({
      ok: true,
      items: [{ slug: "glp-3", size: "15mg", qty: 2 }],
    });
  });

  it("rejects a missing items array", () => {
    expect(parseCartSyncRequest({}).ok).toBe(false);
    expect(parseCartSyncRequest(null).ok).toBe(false);
  });
});

describe("parseIdentifyRequest", () => {
  it("identifies a valid email", () => {
    expect(parseIdentifyRequest({ email: "Lab@Example.com", firstName: "Ada" })).toEqual({
      ok: true,
      email: "lab@example.com",
      firstName: "Ada",
    });
  });

  it("rejects invalid email", () => {
    expect(parseIdentifyRequest({ email: "nope" }).ok).toBe(false);
  });
});

describe("parseRestoreRequest", () => {
  it("reads a token", () => {
    expect(parseRestoreRequest({ token: " abc " })).toBe("abc");
    expect(parseRestoreRequest({})).toBeNull();
  });
});
