import { describe, expect, it } from "vitest";
import {
  formatAddressLine,
  hasMinimumTrustSignals,
  trustSignals,
} from "./trustSignals";

describe("trustSignals", () => {
  it("includes the supplied legal entity, city, and BoHai Peptide partner", () => {
    expect(trustSignals.legalEntityName).toBe("Elevate Precision Health LLC");
    expect(trustSignals.streetAddress).toBeNull();
    expect(trustSignals.postOfficeBoxNumber).toBeNull();
    expect(trustSignals.addressLocality).toBe("Louisville");
    expect(trustSignals.addressRegion).toBe("KY");
    expect(trustSignals.postalCode).toBeNull();
    expect(trustSignals.testingLabName).toBe("BoHai Peptide");
    expect(trustSignals.testingLabUrl).toBe("https://www.bohaipeptide.com/");
    expect(trustSignals.telephone).toBeNull();
    expect(trustSignals.accountablePersonName).toBeNull();
    expect(trustSignals.companyStatement).toContain("dependable research products");
  });

  it("omits a public street address until one is supplied", () => {
    expect(formatAddressLine()).toBeNull();
    expect(hasMinimumTrustSignals()).toBe(false);
  });

  it("prepends PO Box only when a box number and street are set", () => {
    expect(
      formatAddressLine({
        ...trustSignals,
        streetAddress: "1 Main St",
        postalCode: "40202",
        postOfficeBoxNumber: "12345",
      }),
    ).toBe("PO Box 12345, 1 Main St Louisville, KY 40202");
  });
});
