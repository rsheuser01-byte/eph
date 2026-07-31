import { describe, expect, it } from "vitest";
import { formatUpdatedOn, isIsoDate } from "./formatUpdatedOn";

describe("formatUpdatedOn (Phase 3 #7)", () => {
  it("accepts ISO calendar dates", () => {
    expect(isIsoDate("2026-07-31")).toBe(true);
    expect(isIsoDate("2026-7-31")).toBe(false);
    expect(isIsoDate("today")).toBe(false);
  });

  it("formats a stable en-US long date for display", () => {
    expect(formatUpdatedOn("2026-07-31")).toBe("July 31, 2026");
  });
});
