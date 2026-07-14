import type { ChargeInput, CheckoutOutcome, PaymentProvider } from "./types";

type BankfulConfig = {
  baseUrl: string;
  username: string;
  password: string;
};

function readConfig(): BankfulConfig {
  const baseUrl = process.env.BANKFUL_API_BASE_URL;
  const username = process.env.BANKFUL_USERNAME;
  const password = process.env.BANKFUL_PASSWORD;
  if (!baseUrl || !username || !password) {
    throw new Error(
      "Bankful is not configured. Set BANKFUL_API_BASE_URL, BANKFUL_USERNAME, and BANKFUL_PASSWORD.",
    );
  }
  return { baseUrl: baseUrl.replace(/\/$/, ""), username, password };
}

export function createBankfulProvider(): PaymentProvider {
  return {
    name: "bankful",
    async beginCheckout(input: ChargeInput): Promise<CheckoutOutcome> {
      const config = readConfig();
      const body = new URLSearchParams({
        req_username: config.username,
        req_password: config.password,
        transaction_type: "CAPTURE",
        amount: input.amount.toFixed(2),
        request_currency: input.currency,
        pmt_numb: input.card.number.replace(/\s/g, ""),
        pmt_key: input.card.cvv,
        pmt_expiry: `${input.card.expiryMonth.padStart(2, "0")}/${input.card.expiryYear}`,
        cust_fname: input.billing.firstName,
        cust_lname: input.billing.lastName,
        cust_email: input.billing.email,
        cust_phone: input.billing.phone ?? "",
        bill_addr: input.billing.address1,
        bill_addr_city: input.billing.city,
        bill_addr_state: input.billing.state,
        bill_addr_zip: input.billing.zip,
        bill_addr_country: input.billing.country,
        xtl_order_id: input.orderId,
      });

      const response = await fetch(`${config.baseUrl}/api/transaction/api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "cache-control": "no-cache",
        },
        body: body.toString(),
      });

      const data = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      const approved = data.TRANS_STATUS_NAME === "APPROVED";

      return {
        kind: "result",
        approved,
        orderId: input.orderId,
        transactionId: approved
          ? String(data.TRANS_ORDER_ID ?? data.TRANS_REQUEST_ID ?? "")
          : undefined,
        message: approved
          ? undefined
          : String(
              data.ERROR_MESSAGE ??
                data.TRANS_STATUS_NAME ??
                "Payment was declined.",
            ),
      };
    },
  };
}
