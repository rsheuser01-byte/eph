import { describe, expect, it } from "vitest";
import { molecularFormulaParts } from "./molecularFormula";

describe("molecularFormulaParts", () => {
  it("splits element symbols from subscript counts", () => {
    expect(molecularFormulaParts("C221H342N46O68")).toEqual([
      { kind: "text", value: "C" },
      { kind: "sub", value: "221" },
      { kind: "text", value: "H" },
      { kind: "sub", value: "342" },
      { kind: "text", value: "N" },
      { kind: "sub", value: "46" },
      { kind: "text", value: "O" },
      { kind: "sub", value: "68" },
    ]);
  });

  it("leaves surrounding prose intact while subscripting digits in H2O", () => {
    expect(molecularFormulaParts("H2O (with benzyl alcohol preservative)")).toEqual([
      { kind: "text", value: "H" },
      { kind: "sub", value: "2" },
      { kind: "text", value: "O (with benzyl alcohol preservative)" },
    ]);
  });

  it("returns plain text when there are no digits", () => {
    expect(molecularFormulaParts("n/a")).toEqual([
      { kind: "text", value: "n/a" },
    ]);
  });
});
