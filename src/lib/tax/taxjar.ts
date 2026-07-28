import {
  TaxCalculationError,
  roundMoney,
  type TaxProvider,
  type TaxQuote,
  type TaxQuoteInput,
} from "./types";

type TaxJarTaxResponse = {
  tax?: {
    amount_to_collect?: number;
    order_total_amount?: number;
    rate?: number;
    freight_taxable?: boolean;
    jurisdictions?: {
      country?: string;
      state?: string;
      county?: string;
      city?: string;
    };
  };
};

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function taxJarBaseUrl(): string {
  return env("TAXJAR_API_URL") || "https://api.taxjar.com";
}

/**
 * TaxJar sales-tax calculation via POST /v2/taxes.
 * Origin (from_*) comes from env — configure the warehouse/nexus address.
 */
export function createTaxJarProvider(): TaxProvider {
  return {
    name: "taxjar",
    async quote(input: TaxQuoteInput): Promise<TaxQuote> {
      const token = env("TAXJAR_API_TOKEN");
      if (!token) {
        throw new TaxCalculationError();
      }

      const fromCountry = env("TAX_FROM_COUNTRY") || "US";
      const fromState = env("TAX_FROM_STATE");
      const fromZip = env("TAX_FROM_ZIP");
      const fromCity = env("TAX_FROM_CITY");
      const fromStreet = env("TAX_FROM_STREET");

      if (!fromState || !fromZip) {
        console.error("[tax] TaxJar missing TAX_FROM_STATE or TAX_FROM_ZIP");
        throw new TaxCalculationError();
      }

      const amount = roundMoney(
        input.items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0,
        ),
      );

      const defaultTaxCode = env("TAX_PRODUCT_TAX_CODE");
      const body = {
        from_country: fromCountry,
        from_state: fromState,
        from_zip: fromZip,
        from_city: fromCity || undefined,
        from_street: fromStreet || undefined,
        to_country: input.customer.country || "US",
        to_state: input.customer.state,
        to_zip: input.customer.zip,
        to_city: input.customer.city,
        to_street: input.customer.address1,
        amount,
        shipping: roundMoney(input.shipping),
        line_items: input.items.map((item, index) => ({
          id: String(index + 1),
          quantity: item.quantity,
          unit_price: roundMoney(item.unitPrice),
          product_tax_code: item.taxCode || defaultTaxCode || undefined,
        })),
      };

      let response: Response;
      try {
        response = await fetch(`${taxJarBaseUrl()}/v2/taxes`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
      } catch (error) {
        console.error("[tax] TaxJar network error", error);
        throw new TaxCalculationError();
      }

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        console.error("[tax] TaxJar quote failed", {
          status: response.status,
          detail: detail.slice(0, 200),
        });
        throw new TaxCalculationError();
      }

      const payload = (await response.json()) as TaxJarTaxResponse;
      const collected = payload.tax?.amount_to_collect;
      if (typeof collected !== "number" || !Number.isFinite(collected)) {
        console.error("[tax] TaxJar response missing amount_to_collect");
        throw new TaxCalculationError();
      }

      const jurisdictions = payload.tax?.jurisdictions;
      const jurisdiction = jurisdictions
        ? [jurisdictions.city, jurisdictions.county, jurisdictions.state, jurisdictions.country]
            .filter(Boolean)
            .join(", ")
        : undefined;

      return {
        amount: roundMoney(collected),
        provider: "taxjar",
        jurisdiction,
      };
    },
  };
}
