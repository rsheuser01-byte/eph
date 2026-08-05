import { describe, expect, it } from "vitest";
import { parseNewsletterSubscribeRequest } from "./parseRequest";

describe("parseNewsletterSubscribeRequest", () => {
  it("accepts a valid email and normalizes case", () => {
    expect(parseNewsletterSubscribeRequest({ email: " Lab@Example.COM " })).toEqual({
      ok: true,
      value: { email: "lab@example.com" },
    });
  });

  it("rejects missing or invalid email", () => {
    expect(parseNewsletterSubscribeRequest(null).ok).toBe(false);
    expect(parseNewsletterSubscribeRequest({}).ok).toBe(false);
    expect(parseNewsletterSubscribeRequest({ email: "" }).ok).toBe(false);
    expect(parseNewsletterSubscribeRequest({ email: "not-an-email" }).ok).toBe(
      false,
    );
  });
});
