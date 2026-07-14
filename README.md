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

## Notes

- Catalog data lives in `src/data/products.ts` (per-size variants with prices)
- Brand copy and FAQ live in `src/data/site.ts`

## Checkout

Cart-based checkout with a swappable payment provider (`src/lib/payments`).

Create `web/.env.local` with:

```bash
# "mock" (default, no credentials) or "bankful"
PAYMENT_PROVIDER=mock

# Bankful gateway (only when PAYMENT_PROVIDER=bankful)
# Sandbox: https://api-dev1.bankfulportal.com | Live: https://api.paybybankful.com
BANKFUL_API_BASE_URL=https://api-dev1.bankfulportal.com
BANKFUL_USERNAME=
BANKFUL_PASSWORD=

# Order confirmation emails: "console" (default, logs to server) or "resend"
EMAIL_PROVIDER=console
# Required when EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM="Elevate Precision Health <[email protected]>"

# Order store: "file" (default, writes web/.data/orders.json)
ORDER_STORE=file
# Token to view /admin/orders?key=... (leave unset to disable the admin view)
ADMIN_TOKEN=

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- With `PAYMENT_PROVIDER=mock`, test card `4111 1111 1111 1111` is approved and
  `4111 1111 1111 1112` is declined, so the full flow works without credentials.
- The interim on-site card form puts the app in PCI SAQ D scope. For production,
  add a Bankful Hosted Payment Page provider (returns a redirect URL) so card
  entry stays on Bankful's PCI-compliant page.
- On a successful order, a confirmation email goes to the customer and a
  notification to `site.email`. With `EMAIL_PROVIDER=console` these are logged
  to the server console; set `EMAIL_PROVIDER=resend` + `RESEND_API_KEY` +
  `EMAIL_FROM` (verified domain) to actually send.
- Every approved order is saved via the order store (no card data). The `file`
  store writes `web/.data/orders.json` (gitignored). Set `ADMIN_TOKEN` and visit
  `/admin/orders?key=YOUR_ADMIN_TOKEN` to review orders. The file store is not
  durable on serverless hosts — see TODO for the production database task.

See [TODO.md](./TODO.md) for the remaining production tasks.
