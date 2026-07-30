import { describe, expect, it } from "vitest";
import {
  formatAddressLine,
  hasMinimumTrustSignals,
  trustSignals,
} from "./trustSignals";

describe("trustSignals", () => {
  it("includes the supplied legal entity, Louisville address, and BoHai Peptide partner", () => {
    expect(trustSignals.legalEntityName).toBe("Elevate Precision Health LLC");
    expect(trustSignals.streetAddress).toBe("3801 Billtown Rd");
    expect(trustSignals.postOfficeBoxNumber).toBeNull();
    expect(trustSignals.addressLocality).toBe("Louisville");
    expect(trustSignals.addressRegion).toBe("KY");
    expect(trustSignals.postalCode).toBe("40299");
    expect(trustSignals.testingLabName).toBe("BoHai Peptide");
    expect(trustSignals.testingLabUrl).toBe("https://www.bohaipeptide.com/");
    expect(trustSignals.telephone).toBeNull();
    expect(trustSignals.accountablePersonName).toBeNull();
    expect(trustSignals.companyStatement).toContain("dependable research products");
  });

  it("formats the public address and meets the minimum trust gate", () => {
    expect(formatAddressLine()).toBe(
      "3801 Billtown Rd Louisville, KY 40299",
    );
    expect(hasMinimumTrustSignals()).toBe(true);
  });

  it("prepends PO Box only when a box number is set", () => {
    expect(
      formatAddressLine({
        ...trustSignals,
        postOfficeBoxNumber: "12345",
      }),
    ).toBe("PO Box 12345, 3801 Billtown Rd Louisville, KY 40299");
  });
});
