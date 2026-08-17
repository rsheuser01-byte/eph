import { describe, expect, it } from "vitest";
import { isValidEmail, normalizeEmail } from "./email";

describe("abandoned cart email", () => {
  it("accepts syntactically valid emails", () => {
    expect(isValidEmail("lab@example.com")).toBe(true);
    expect(isValidEmail("  Lab@Example.COM  ")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing@domain")).toBe(false);
    expect(isValidEmail("@example.com")).toBe(false);
  });

  it("normalizes to lowercase trimmed", () => {
    expect(normalizeEmail("  Ada@Example.com ")).toBe("ada@example.com");
  });
});
