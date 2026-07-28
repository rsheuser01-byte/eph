import { createHmac } from "node:crypto";
import type {
  ChargeInput,
  CheckoutOutcome,
  PaymentProvider,
  RefundInput,
  RefundOutcome,
} from "./types";

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

async function postTransaction(
  config: BankfulConfig,
  fields: Record<string, string>,
): Promise<Record<string, unknown>> {
  const body = new URLSearchParams({
    req_username: config.username,
    req_password: config.password,
    ...fields,
  });

  const response = await fetch(`${config.baseUrl}/api/transaction/api`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "cache-control": "no-cache",
    },
    body: body.toString(),
  });

  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

function mapRefundResponse(data: Record<string, unknown>): RefundOutcome {
  const approved = data.TRANS_STATUS_NAME === "APPROVED";
  return {
    ok: approved,
    transactionId: approved
      ? String(data.TRANS_ORDER_ID ?? data.TRANS_REQUEST_ID ?? "")
      : undefined,
    message: approved
      ? undefined
      : String(
          data.ERROR_MESSAGE ??
            data.TRANS_STATUS_NAME ??
            "Refund was declined.",
        ),
  };
}

export function createBankfulProvider(): PaymentProvider {
  return {
    name: "bankful",
    async beginCheckout(input: ChargeInput): Promise<CheckoutOutcome> {
      if (!input.card) {
        throw new Error("Card details are required for direct Bankful capture.");
      }
      const config = readConfig();
      const data = await postTransaction(config, {
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

    async refund(input: RefundInput): Promise<RefundOutcome> {
      const config = readConfig();
      const data = await postTransaction(config, {
        transaction_type: "REFUND",
        amount: input.amount.toFixed(2),
        request_ref_po_id: input.transactionId,
      });
      return mapRefundResponse(data);
    },

    async cancel(input: {
      orderId: string;
      transactionId: string;
    }): Promise<RefundOutcome> {
      const config = readConfig();
      const data = await postTransaction(config, {
        transaction_type: "CANCEL",
        amount: "0",
        request_ref_po_id: input.transactionId,
      });
      return mapRefundResponse(data);
    },
  };
}

/**
 * HMAC-SHA256 hex signature for Bankful HPP.
 * Message = alphabetically sorted key-value pairs concatenated without separators.
 * Key = gateway password.
 */
export function signBankfulHppPayload(
  fields: Record<string, string>,
  password: string,
): string {
  const message = Object.keys(fields)
    .filter((key) => key !== "signature" && fields[key] !== "")
    .sort()
    .map((key) => `${key}${fields[key]}`)
    .join("");
  return createHmac("sha256", password).update(message).digest("hex");
}

function siteBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) {
    return explicit;
  }
  throw new Error(
    "NEXT_PUBLIC_SITE_URL is required for Bankful HPP return/callback URLs.",
  );
}

export function createBankfulHppProvider(): PaymentProvider {
  return {
    name: "bankful-hpp",
    async beginCheckout(input: ChargeInput): Promise<CheckoutOutcome> {
      const config = readConfig();
      const base = siteBaseUrl();
      const fields: Record<string, string> = {
        amount: input.amount.toFixed(2),
        request_currency: input.currency,
        req_username: config.username,
        cust_fname: input.billing.firstName,
        cust_lname: input.billing.lastName,
        cust_email: input.billing.email,
        cust_phone: input.billing.phone ?? "",
        bill_addr: input.billing.address1,
        bill_addr_2: input.billing.address2 ?? "",
        bill_addr_city: input.billing.city,
        bill_addr_state: input.billing.state,
        bill_addr_zip: input.billing.zip,
        bill_addr_country: input.billing.country,
        xtl_order_id: input.orderId,
        url_complete: `${base}/checkout/success?order=${encodeURIComponent(input.orderId)}`,
        url_failed: `${base}/checkout?error=payment_failed`,
        url_cancel: `${base}/checkout?error=payment_cancelled`,
        url_pending: `${base}/checkout/success?order=${encodeURIComponent(input.orderId)}&pending=1`,
        url_callback: `${base}/api/payments/bankful/ipn`,
        return_redirect_url: "Y",
      };

      fields.signature = signBankfulHppPayload(fields, config.password);

      const response = await fetch(
        `${config.baseUrl}/front-calls/go-in/hosted-page-pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams(fields).toString(),
        },
      );

      const data = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      const redirectUrl = String(data.redirect_url ?? "");
      if (!redirectUrl) {
        throw new Error(
          String(
            data.ERROR_MESSAGE ??
              "Bankful HPP did not return a redirect_url.",
          ),
        );
      }

      return { kind: "redirect", url: redirectUrl };
    },

    async refund(input: RefundInput): Promise<RefundOutcome> {
      return createBankfulProvider().refund!(input);
    },

    async cancel(input: {
      orderId: string;
      transactionId: string;
    }): Promise<RefundOutcome> {
      return createBankfulProvider().cancel!(input);
    },
  };
}
