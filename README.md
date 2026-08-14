# Elevate Precision Health

Next.js marketing + research catalog site rebuilt from the incomplete HTTrack mirror of the prior WordPress storefront.

## Develop

```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase (Postgres) for durable orders + inventory

## Notes

- Catalog data lives in `src/data/products.ts` (per-size variants with prices)
- Brand copy and FAQ live in `src/data/site.ts`
- Stock quantities live in Supabase `inventory` (not in the product catalog file)

## Checkout

Cart-based checkout with a swappable payment provider (`src/lib/payments`).

Create `web/.env.local` with:

```bash
# Canonical site URL (no trailing slash) — required for Stripe return URLs + SEO
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Payment: "mock" | "mock-hpp" | "stripe"
PAYMENT_PROVIDER=stripe
# Mirror the provider for the checkout UI (hides on-site card fields for hosted checkout)
NEXT_PUBLIC_PAYMENT_PROVIDER=stripe

# Stripe (required in production). Prefer a restricted key (rk_) over sk_.
# Dashboard: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=
# Webhook signing secret for POST /api/payments/stripe/webhook
# Events: checkout.session.completed, checkout.session.async_payment_succeeded,
# checkout.session.async_payment_failed, checkout.session.expired
STRIPE_WEBHOOK_SECRET=

# Order confirmation emails: "console" (default) or "resend"
EMAIL_PROVIDER=console
RESEND_API_KEY=
EMAIL_FROM="Elevate Precision Health <[email protected]>"
# Optional override for store/ops alerts (defaults to site contact email)
STORE_NOTIFICATION_EMAIL=
# Reply-To for customer-facing and marketing messages (defaults to site.email)
EMAIL_REPLY_TO=support@elevateprecisionhealth.com
# Marketing / newsletter sender (Resend templates — server-only, verified domain)
MARKETING_EMAIL_FROM="Elevate Precision Health <updates@YOUR_VERIFIED_DOMAIN>"

# Sales tax: "mock" (local only, $0) or "taxjar" (required in production)
TAX_PROVIDER=mock
TAXJAR_API_TOKEN=
# Optional TaxJar base URL (default https://api.taxjar.com)
# TAXJAR_API_URL=https://api.taxjar.com
# Warehouse / nexus origin address for TaxJar quotes
TAX_FROM_COUNTRY=US
TAX_FROM_STATE=
TAX_FROM_ZIP=
TAX_FROM_CITY=
TAX_FROM_STREET=
# Optional default product tax code (omit = fully taxable per TaxJar)
# TAX_PRODUCT_TAX_CODE=

# Durable rate limits (required in production)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional Sentry DSN for critical payment/ops alerts
# SENTRY_DSN=

# Orders: "file" (local JSON) or "supabase" (production)
ORDER_STORE=file

# Supabase (required when ORDER_STORE=supabase or for inventory enforcement)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=

# Admin password for /admin/login
ADMIN_TOKEN=
ADMIN_SESSION_SECRET=

# Optional low-stock email threshold (default 5)
LOW_STOCK_THRESHOLD=5

# Inventory reservations (HPP pending checkouts)
CHECKOUT_RESERVATION_MINUTES=30
# Protects /api/cron/expire-reservations (Authorization: Bearer …)
CRON_SECRET=
# Optional dedicated secret for detailed /api/readiness diagnostics
# (falls back to CRON_SECRET when unset)
READINESS_SECRET=

# Activepieces marketing automation (optional — not wired to orders yet)
# Leave MARKETING_AUTOMATION_ENABLED unset/false until ready. When "true",
# ACTIVEPIECES_WEBHOOK_URL and ACTIVEPIECES_WEBHOOK_SECRET are required.
# Test locally: npm run test:activepieces
MARKETING_AUTOMATION_ENABLED=false
ACTIVEPIECES_WEBHOOK_URL=
ACTIVEPIECES_WEBHOOK_SECRET=
# Homepage newsletter popup → Activepieces (server-only webhook URL)
ACTIVEPIECES_NEWSLETTER_WEBHOOK=
```

Local/dev without Stripe keys: `PAYMENT_PROVIDER=mock-hpp` (Playwright default). Card fields stay off-site; checkout completes via the mock hosted helper.

### Stripe webhook (production)

1. In [Stripe Developers → Webhooks](https://dashboard.stripe.com/webhooks), add endpoint `{NEXT_PUBLIC_SITE_URL}/api/payments/stripe/webhook`.
2. Subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`.
3. Set `STRIPE_WEBHOOK_SECRET` to the endpoint signing secret (`whsec_...`).
4. Use test-mode keys (`rk_test_` / `sk_test_`) until the first live order; then switch to live keys and a live webhook endpoint.

Local forwarding (optional): `stripe listen --forward-to localhost:3000/api/payments/stripe/webhook`.

### Marketing / newsletter email

- Homepage newsletter popup (after age gate + 5s): sitewide, viewport-centered at the bottom; posts to `/api/newsletter`, which forwards `{ email, firstName, source: "website_newsletter" }` to `ACTIVEPIECES_NEWSLETTER_WEBHOOK` (server-only — never exposed to the browser).
- Legacy Resend path still available at `/api/newsletter/subscribe` (contact + `eph-newsletter-welcome` template) if you need it for ops scripts.
- Preview welcome email HTML: `npm run preview:welcome-email` → `tmp/sample-welcome-email.html`
- Sync/publish Resend template `eph-newsletter-welcome`: `npm run sync:resend-welcome` (requires `RESEND_API_KEY` + `MARKETING_EMAIL_FROM`)
- Export Resend-dashboard paste HTML: `npm run export:resend-welcome-paste` → `tmp/resend-welcome-template.html`

### Orders & inventory

- Set `ORDER_STORE=supabase` plus Supabase env vars for durable orders on Vercel.
- SQL migrations: [`supabase/migrations/`](./supabase/migrations/).
- Import local JSON history: `npx tsx scripts/import-orders-json.ts` (with Supabase env set).
- Admin: `/admin/login` → `/admin/orders` (ship / fulfill / refund / resend emails) and `/admin/inventory` (receive / adjust).
- Inventory: checkout creates **active reservations** (does not decrement on-hand until payment is verified). Available qty = on hand − active reservations. Call `/api/cron/expire-reservations` with `CRON_SECRET` to expire abandoned Stripe Checkout sessions.
- Vercel Cron: Hobby allows **once per day** only. `vercel.json` schedules expire-reservations at 06:00 UTC and process-outbox at 07:00 UTC. Upgrade to Pro (or trigger the routes manually) for the original every-15m / every-5m cadence.
- Legacy RPCs `reserve_stock` / `release_stock` remain for compatibility; new flow uses `create_inventory_reservations` / `commit_inventory_reservations` / `release_inventory_reservations`.

### Production fail-closed

In `NODE_ENV=production` (or `VERCEL_ENV=production`), checkout returns **503** unless:

- `PAYMENT_PROVIDER=stripe` (mock / on-site card capture blocked)
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `NEXT_PUBLIC_SITE_URL`
- Supabase URL + service role + `ORDER_STORE=supabase`
- Resend email config
- TaxJar (`TAX_PROVIDER=taxjar`, token, origin state/ZIP)
- Upstash Redis (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`)
- Admin + `CRON_SECRET`

Customers never see which variable is missing (logged server-side only).

Probes:

- `GET /api/health` — liveness
- `GET /api/readiness` — `{ ready }` public; detailed `checks` with `Authorization: Bearer READINESS_SECRET` (or `CRON_SECRET`)

### Durable paid-order side effects

- Approving payment enqueues an `order.paid` outbox event and **sends the confirmation immediately** (same request). Shipped / refunded / cancelled emails do the same.
- `GET/POST /api/cron/process-outbox` (Bearer `CRON_SECRET`) is a retry backup: idempotent `email_deliveries` keys and backoff if the immediate send fails.
- After max attempts, the event is marked `failed` and the store receives an alert email.
- Admins can intentionally resend confirmation or shipping emails via `/api/admin/orders/[orderId]/resend-email`.

### Checkout status UX

- Success URL alone never proves payment. `/checkout/success` loads status from the database using `order` + opaque `token`.
- Pending payments poll `GET /api/orders/[orderId]/status?token=…`.
- Hosted checkout CTA: **Continue to secure payment**. Failed/cancelled Stripe returns keep the cart and explain no charge was confirmed.

### Sales tax

- Server quotes tax via TaxJar (`TAX_PROVIDER=taxjar`) using the shipping address; client-supplied tax is ignored.
- Checkout UI calls `POST /api/checkout/tax` for a live estimate; final charge uses a fresh quote at `POST /api/checkout`.
- Orders persist `tax`, `tax_provider`, and jurisdiction summary. Stripe amount = subtotal + shipping + tax − discount.
- Tax failures return a safe 503 — never silently charge $0 tax in production.
- Configure nexus/product tax codes with a tax advisor; optional `TAX_PRODUCT_TAX_CODE` applies a default TaxJar product code.

### Security, rate limits, and audit

- Durable rate limits via Upstash Redis (memory fallback locally). Applied to checkout, order status, admin login, Stripe webhooks (generous), refunds, inventory, and fulfillment.
- Admin actions write to `admin_audit_log` (or `.data/admin_audit_log.json`) with hashed IPs — never raw addresses.
- Security headers: CSP, `X-Frame-Options`, `nosniff`, Referrer-Policy; HSTS in production.
- Critical payment/ops events email the store (cooldown) and optionally emit to Sentry when `SENTRY_DSN` is set.
- Admin remains a shared `ADMIN_TOKEN` session (httpOnly, 8h). Per-user IdP + MFA are still recommended before multi-staff use.

### Testing & CI

- Unit/integration: `npm run test` (Vitest).
- E2E (mock-hpp): `npm run test:e2e` (Playwright). Starts a local Next server with mock payment/tax/file orders.
- GitHub Actions (`.github/workflows/ci.yml`): lint → unit tests → build → Playwright.

### Payments

- `stripe` (production): redirect to Stripe-hosted Checkout; webhook at `/api/payments/stripe/webhook`.
- `mock-hpp` (local/E2E): redirect to a local hosted-payment helper.
- `mock`: on-site card capture for local experiments only (blocked in production).
- Webhooks require a valid `Stripe-Signature`, retrieve the Checkout Session from Stripe, reconcile amount/currency in integer cents against the stored order, and persist idempotent rows in `payment_events`.
- Forged, unsigned, or amount/currency-mismatched callbacks cannot approve an order.
- Refunds: admin **Refund** on an approved order calls Stripe Refunds (or mock). Restocks when fulfillment is still `unfulfilled`.

See [TODO.md](./TODO.md) for remaining production tasks. See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for the hardening phase map. See [LAUNCH_READINESS.md](./LAUNCH_READINESS.md) for Phase 10 go-live checklist status (CODE / OPS / BLOCKED) and sign-off.
