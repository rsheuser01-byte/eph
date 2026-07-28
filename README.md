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

# Order confirmation emails: "console" (default) or "resend"
EMAIL_PROVIDER=console
RESEND_API_KEY=
EMAIL_FROM="Elevate Precision Health <[email protected]>"

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
```

### Orders & inventory

- Set `ORDER_STORE=supabase` plus Supabase env vars for durable orders on Vercel.
- SQL migrations: [`supabase/migrations/`](./supabase/migrations/).
- Import local JSON history: `npx tsx scripts/import-orders-json.ts` (with Supabase env set).
- Admin: `/admin/login` → `/admin/orders` (fulfill / refund) and `/admin/inventory` (receive / adjust).
- Inventory RPCs: `reserve_stock`, `release_stock`, `adjust_stock`. Checkout decrements stock when Supabase is configured; without Supabase keys, stock checks are skipped (local-only).

### Payments

- `mock` / `bankful`: on-site card capture (PCI SAQ D for live Bankful direct).
- `bankful-hpp` / `mock-hpp`: redirect to hosted payment; IPN at `/api/payments/bankful/ipn`. Prefer HPP for production.
- Refunds: admin **Refund** on an approved order calls Bankful `REFUND` (or mock). Restocks when fulfillment is still `unfulfilled`.

See [TODO.md](./TODO.md) for remaining production tasks.
