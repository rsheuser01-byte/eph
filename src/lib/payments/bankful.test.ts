import { describe, expect, it } from "vitest";
import { signBankfulHppPayload } from "./bankful";

describe("Bankful HPP signature", () => {
  it("hashes sorted key-value pairs with the password", () => {
    const fields = {
      amount: "1",
      bill_addr: "4/22",
      xtl_order_id: "123456",
      req_username: "sandbox_username",
    };
    const first = signBankfulHppPayload(fields, "sandbox_password");
    const second = signBankfulHppPayload(
      {
        xtl_order_id: "123456",
        req_username: "sandbox_username",
        bill_addr: "4/22",
        amount: "1",
      },
      "sandbox_password",
    );
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });
});
