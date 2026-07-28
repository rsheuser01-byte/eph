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
# Canonical site URL (no trailing slash) — required for HPP return URLs + SEO
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Payment: "mock" | "mock-hpp" | "bankful" | "bankful-hpp"
PAYMENT_PROVIDER=mock
# Mirror the provider for the checkout UI (hides on-site card fields for *-hpp)
NEXT_PUBLIC_PAYMENT_PROVIDER=mock

# Bankful gateway (bankful / bankful-hpp)
# Sandbox: https://api-dev1.bankfulportal.com | Live: https://api.paybybankful.com
BANKFUL_API_BASE_URL=https://api-dev1.bankfulportal.com
BANKFUL_USERNAME=
BANKFUL_PASSWORD=
# Optional: confirmed STATUS/query transaction_type for server-to-server lookup.
# Leave empty to reconcile from signature-authenticated HPP callbacks (fail closed
# if neither STATUS type nor authenticated callback is available).
# TODO: confirm exact value with Bankful merchant docs before enabling in production.
# BANKFUL_STATUS_TRANSACTION_TYPE=

# Order confirmation emails: "console" (default) or "resend"
EMAIL_PROVIDER=console
RESEND_API_KEY=
EMAIL_FROM="Elevate Precision Health <[email protected]>"
# Optional override for store/ops alerts (defaults to site contact email)
STORE_NOTIFICATION_EMAIL=

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
```

### Orders & inventory

- Set `ORDER_STORE=supabase` plus Supabase env vars for durable orders on Vercel.
- SQL migrations: [`supabase/migrations/`](./supabase/migrations/).
- Import local JSON history: `npx tsx scripts/import-orders-json.ts` (with Supabase env set).
- Admin: `/admin/login` → `/admin/orders` (ship / fulfill / refund / resend emails) and `/admin/inventory` (receive / adjust).
- Inventory: checkout creates **active reservations** (does not decrement on-hand until payment is verified). Available qty = on hand − active reservations. Call `/api/cron/expire-reservations` with `CRON_SECRET` to expire abandoned HPP checkouts.
- Legacy RPCs `reserve_stock` / `release_stock` remain for compatibility; new flow uses `create_inventory_reservations` / `commit_inventory_reservations` / `release_inventory_reservations`.

### Production fail-closed

In `NODE_ENV=production` (or `VERCEL_ENV=production`), checkout returns **503** unless:

- `PAYMENT_PROVIDER=bankful-hpp` (mock / direct card capture blocked)
- Bankful credentials + `NEXT_PUBLIC_SITE_URL`
- Supabase URL + service role + `ORDER_STORE=supabase`
- Resend email config
- Admin + `CRON_SECRET`

Customers never see which variable is missing (logged server-side only).

Probes:

- `GET /api/health` — liveness
- `GET /api/readiness` — `{ ready }` public; detailed `checks` with `Authorization: Bearer READINESS_SECRET` (or `CRON_SECRET`)

### Durable paid-order side effects

- Approving payment enqueues an `order.paid` outbox event (does not send email inline).
- Marking an order **shipped** (with tracking) enqueues `order.shipped`; refunds enqueue `order.refunded`; cancel enqueues `order.cancelled`.
- `GET/POST /api/cron/process-outbox` (Bearer `CRON_SECRET`) sends emails with idempotent `email_deliveries` keys and retries with backoff.
- After max attempts, the event is marked `failed` and the store receives an alert email.
- Admins can intentionally resend confirmation or shipping emails via `/api/admin/orders/[orderId]/resend-email`.

### Checkout status UX

- Success URL alone never proves payment. `/checkout/success` loads status from the database using `order` + opaque `token`.
- Pending payments poll `GET /api/orders/[orderId]/status?token=…`.
- Hosted checkout CTA: **Continue to secure payment**. Failed/cancelled Bankful returns keep the cart and explain no charge was confirmed.

### Payments

- `mock` / `bankful`: on-site card capture (PCI SAQ D for live Bankful direct).
- `bankful-hpp` / `mock-hpp`: redirect to hosted payment; IPN at `/api/payments/bankful/ipn`. Prefer HPP for production.
- IPN callbacks require a valid Bankful HMAC signature (`BANKFUL_PASSWORD`), reconcile amount/currency in integer cents against the stored order, and persist idempotent rows in `payment_events` (or `.data/payment_events.json` when `ORDER_STORE=file`).
- Forged, unsigned, or amount/currency-mismatched callbacks cannot approve an order.
- Refunds: admin **Refund** on an approved order calls Bankful `REFUND` (or mock). Restocks when fulfillment is still `unfulfilled`.

See [TODO.md](./TODO.md) for remaining production tasks. See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for the hardening phase map.
