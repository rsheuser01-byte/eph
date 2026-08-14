export type ProductionConfigIssue = {
  key: string;
  message: string;
  severity: "error" | "warning";
};

export type ProductionConfigAssessment = {
  ok: boolean;
  issues: ProductionConfigIssue[];
};

export const publicCheckoutUnavailableMessage =
  "Checkout is temporarily unavailable.";

export class ProductionConfigurationError extends Error {
  readonly issues: ProductionConfigIssue[];

  constructor(issues: ProductionConfigIssue[]) {
    super(publicCheckoutUnavailableMessage);
    this.name = "ProductionConfigurationError";
    this.issues = issues;
  }
}

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function isProductionRuntime(): boolean {
  // Playwright / local E2E servers opt out so mock-hpp + mock tax can run.
  if (process.env.E2E_MODE === "1") {
    return false;
  }
  if (process.env.NODE_ENV === "production") {
    return true;
  }
  // Vercel production deploys set VERCEL_ENV=production.
  return process.env.VERCEL_ENV === "production";
}

function requireNonEmpty(
  key: string,
  message: string,
  issues: ProductionConfigIssue[],
): void {
  if (!env(key)) {
    issues.push({ key, message, severity: "error" });
  }
}

/**
 * Assess whether the current environment is safe for live checkout.
 * Non-production runtimes always return ok (local mock/file stores allowed).
 */
export function assessProductionConfig(
  options: { forceProduction?: boolean } = {},
): ProductionConfigAssessment {
  const issues: ProductionConfigIssue[] = [];
  const production = options.forceProduction || isProductionRuntime();

  if (!production) {
    return { ok: true, issues };
  }

  requireNonEmpty(
    "NEXT_PUBLIC_SITE_URL",
    "Canonical site URL is required for Stripe Checkout return URLs.",
    issues,
  );

  const paymentProvider = env("PAYMENT_PROVIDER").toLowerCase() || "mock";
  if (paymentProvider !== "stripe") {
    issues.push({
      key: "PAYMENT_PROVIDER",
      message:
        "Production checkout requires PAYMENT_PROVIDER=stripe (mock and on-site card capture are disabled).",
      severity: "error",
    });
  }

  const publicPayment = env("NEXT_PUBLIC_PAYMENT_PROVIDER").toLowerCase();
  if (publicPayment && publicPayment !== "stripe") {
    issues.push({
      key: "NEXT_PUBLIC_PAYMENT_PROVIDER",
      message: "NEXT_PUBLIC_PAYMENT_PROVIDER should be stripe in production.",
      severity: "error",
    });
  }

  requireNonEmpty(
    "STRIPE_SECRET_KEY",
    "Stripe secret key is required (prefer a restricted key).",
    issues,
  );
  requireNonEmpty(
    "STRIPE_WEBHOOK_SECRET",
    "Stripe webhook signing secret is required.",
    issues,
  );

  requireNonEmpty(
    "NEXT_PUBLIC_SUPABASE_URL",
    "Supabase URL is required for inventory and orders.",
    issues,
  );
  requireNonEmpty(
    "SUPABASE_SERVICE_ROLE_KEY",
    "Supabase service role key is required for inventory enforcement.",
    issues,
  );

  const orderStore = env("ORDER_STORE").toLowerCase() || "file";
  if (orderStore !== "supabase") {
    issues.push({
      key: "ORDER_STORE",
      message: "Production requires ORDER_STORE=supabase.",
      severity: "error",
    });
  }

  requireNonEmpty("ADMIN_TOKEN", "Admin login token is required.", issues);
  requireNonEmpty(
    "ADMIN_SESSION_SECRET",
    "Admin session signing secret is required.",
    issues,
  );

  const emailProvider = env("EMAIL_PROVIDER").toLowerCase() || "console";
  if (emailProvider !== "resend") {
    issues.push({
      key: "EMAIL_PROVIDER",
      message: "Production email requires EMAIL_PROVIDER=resend.",
      severity: "error",
    });
  }
  requireNonEmpty("RESEND_API_KEY", "Resend API key is required.", issues);
  requireNonEmpty("EMAIL_FROM", "EMAIL_FROM is required.", issues);

  requireNonEmpty(
    "CRON_SECRET",
    "CRON_SECRET is required to protect reservation expiration.",
    issues,
  );

  const taxProvider = env("TAX_PROVIDER").toLowerCase() || "mock";
  if (taxProvider === "taxjar") {
    requireNonEmpty("TAXJAR_API_TOKEN", "TaxJar API token is required.", issues);
    requireNonEmpty(
      "TAX_FROM_STATE",
      "Warehouse/nexus state (TAX_FROM_STATE) is required for TaxJar.",
      issues,
    );
    requireNonEmpty(
      "TAX_FROM_ZIP",
      "Warehouse/nexus ZIP (TAX_FROM_ZIP) is required for TaxJar.",
      issues,
    );
  } else if (taxProvider !== "mock" && taxProvider !== "stripe") {
    issues.push({
      key: "TAX_PROVIDER",
      message: "TAX_PROVIDER must be mock, stripe, or taxjar.",
      severity: "error",
    });
  }

  requireNonEmpty(
    "UPSTASH_REDIS_REST_URL",
    "Upstash Redis URL is required for durable rate limits.",
    issues,
  );
  requireNonEmpty(
    "UPSTASH_REDIS_REST_TOKEN",
    "Upstash Redis token is required for durable rate limits.",
    issues,
  );

  if (!env("GOOGLE_MAPS_API_KEY")) {
    issues.push({
      key: "GOOGLE_MAPS_API_KEY",
      message:
        "Google address verification is not configured. Checkout will accept unverified shipping addresses.",
      severity: "warning",
    });
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  return { ok: errors.length === 0, issues };
}

/**
 * Throw a customer-safe error when production checkout dependencies are missing.
 * Logs issue keys server-side; never includes them in the Error message.
 */
export function assertProductionCheckoutReady(): void {
  const assessment = assessProductionConfig();
  const errors = assessment.issues.filter((issue) => issue.severity === "error");
  if (errors.length === 0) {
    for (const warning of assessment.issues.filter(
      (issue) => issue.severity === "warning",
    )) {
      console.warn(`[config] ${warning.key}: ${warning.message}`);
    }
    return;
  }

  console.error(
    "[config] production checkout blocked",
    errors.map((issue) => ({ key: issue.key, message: issue.message })),
  );
  throw new ProductionConfigurationError(errors);
}

/** Inventory must never silently no-op in production. */
export function assertInventoryConfigured(): void {
  if (!isProductionRuntime()) {
    return;
  }
  if (
    env("NEXT_PUBLIC_SUPABASE_URL") &&
    env("SUPABASE_SERVICE_ROLE_KEY")
  ) {
    return;
  }
  const issues: ProductionConfigIssue[] = [
    {
      key: "SUPABASE_SERVICE_ROLE_KEY",
      message: "Inventory requires Supabase in production.",
      severity: "error",
    },
  ];
  console.error("[config] inventory blocked in production", issues);
  throw new ProductionConfigurationError(issues);
}
