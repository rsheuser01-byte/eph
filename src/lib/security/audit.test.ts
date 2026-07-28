import { describe, expect, it } from "vitest";
import { hashIpForAudit } from "./audit";

describe("hashIpForAudit", () => {
  it("returns a stable hex digest and never the raw IP", () => {
    const hash = hashIpForAudit("1.2.3.4", "secret");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain("1.2.3.4");
    expect(hashIpForAudit("1.2.3.4", "secret")).toBe(hash);
    expect(hashIpForAudit("1.2.3.4", "other")).not.toBe(hash);
  });
});
