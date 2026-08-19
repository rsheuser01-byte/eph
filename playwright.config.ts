import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;

const e2eEnv: Record<string, string> = {
  E2E_MODE: "1",
  PAYMENT_PROVIDER: "mock-hpp",
  NEXT_PUBLIC_PAYMENT_PROVIDER: "mock-hpp",
  NEXT_PUBLIC_SITE_URL: baseURL,
  TAX_PROVIDER: "mock",
  ORDER_STORE: "file",
  EMAIL_PROVIDER: "console",
  ADMIN_TOKEN: "e2e-admin-token",
  ADMIN_SESSION_SECRET: "e2e-admin-session-secret",
  GOOGLE_MAPS_API_KEY: "",
  // Force inventory soft-skip so catalog is purchasable without seeded stock.
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_TRUSTPILOT_INVITE_KEY: "off",
  SUPABASE_SERVICE_ROLE_KEY: "",
};

for (const [key, value] of Object.entries(process.env)) {
  if (
    typeof value === "string" &&
    !(key in e2eEnv) &&
    key !== "NEXT_PUBLIC_SUPABASE_URL" &&
    key !== "SUPABASE_SERVICE_ROLE_KEY"
  ) {
    e2eEnv[key] = value;
  }
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx next build && npx next start --hostname 127.0.0.1 --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: e2eEnv,
  },
});
