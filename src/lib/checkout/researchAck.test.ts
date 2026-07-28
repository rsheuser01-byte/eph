import { describe, expect, it } from "vitest";
import { researchUseAckError } from "./researchAck";

describe("researchUseAckError", () => {
  it("rejects missing or falsy acknowledgment", () => {
    expect(researchUseAckError({})).toMatch(/acknowledgment/i);
    expect(researchUseAckError({ researchUseAcknowledged: false })).toMatch(
      /acknowledgment/i,
    );
    expect(researchUseAckError({ researchUseAcknowledged: "true" })).toMatch(
      /acknowledgment/i,
    );
  });

  it("accepts explicit boolean true", () => {
    expect(researchUseAckError({ researchUseAcknowledged: true })).toBeNull();
  });
});
