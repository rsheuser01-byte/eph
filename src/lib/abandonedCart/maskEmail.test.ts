import { describe, expect, it } from "vitest";
import { maskEmail } from "./maskEmail";

describe("maskEmail", () => {
  it("masks the local part and keeps the domain", () => {
    expect(maskEmail("robert@example.com")).toBe("r***@example.com");
  });

  it("handles missing values", () => {
    expect(maskEmail(null)).toBe("—");
    expect(maskEmail("")).toBe("—");
  });
});
