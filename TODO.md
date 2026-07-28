# Store — remaining work

Follow-ups to take the Bankful checkout store from working demo to production.
Ordered roughly by priority.

## Payments / go-live
- [ ] Obtain Bankful **sandbox** credentials; set `PAYMENT_PROVIDER=bankful` (or
      `bankful-hpp`) + `BANKFUL_USERNAME` / `BANKFUL_PASSWORD` and re-test.
- [ ] Complete Bankful **live** merchant onboarding; swap `BANKFUL_API_BASE_URL`
      to `https://api.paybybankful.com` and use live credentials.
- [x] **Hosted Payment Page (HPP)** provider (`bankful-hpp` / `mock-hpp`) +
      IPN at `/api/payments/bankful/ipn`. Prefer HPP for production (SAQ A).
- [x] IPN signature verification, amount/currency reconciliation (cents),
      callback idempotency via `payment_events`, and `review_required` on mismatch.
- [ ] Confirm Bankful **STATUS/query** `transaction_type` with merchant docs and
      set `BANKFUL_STATUS_TRANSACTION_TYPE` for full server-to-server lookup.
- [x] Refunds / cancellations — admin refund action + Bankful `REFUND`/`CANCEL`
      (and mock). Restock when fulfillment is still `unfulfilled`.

## Catalog / pricing
- [ ] Replace PLACEHOLDER variant prices/sizes in `src/data/products.ts`
      (search the file for `PLACEHOLDER`).
- [ ] Confirm real shipping rates (currently flat $12, free at $150) and whether
      international shipping is offered.
- [x] Sales tax via TaxJar adapter (`TAX_PROVIDER=taxjar`); mock only for local.
      Still need TaxJar account, nexus config, and advisor sign-off.
- [x] Inventory / stock status per variant (Supabase `inventory` + admin UI).
- [x] Inventory **reservations** for HPP pending checkouts (commit/release/expire).

## Orders / email
- [ ] Set up Resend: verify sending domain, set `EMAIL_PROVIDER=resend`,
      `RESEND_API_KEY`, `EMAIL_FROM`.
- [x] Persist orders via order store; view at `/admin/orders` after `/admin/login`.
- [x] Supabase `OrderStore` (`ORDER_STORE=supabase`) + migrations under
      `supabase/migrations/`. Keep `file` for optional local fallback.
- [x] Admin login with httpOnly signed session cookie (`/admin/login`).
- [x] Durable `order.paid` outbox + `/api/cron/process-outbox` email retries.
- [x] Shipping/tracking fields + shipped/refund/cancel emails via outbox;
      admin mark shipped + intentional resend.
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel from the Supabase dashboard
      (service role is not exposed via MCP). Project: `elevate-precision-health`.
- [ ] Receive real starting stock via `/admin/inventory` (seeded at 0).
- [ ] Optional: set `STORE_NOTIFICATION_EMAIL` for ops alerts (defaults to site email).

## Trust / compliance
- [x] Checkout success uses DB status + opaque `lookup_token` (not URL alone);
      hosted CTA “Continue to secure payment”; cancel/fail keeps cart.
- [ ] Keep "Research Use Only" disclaimers on every product + checkout page
      (required by high-risk underwriting). Server-side ack on `/api/checkout`
      still optional follow-up.
- [ ] Review refund/terms/privacy pages against the live payment flow.

## Infra / QA
- [ ] Set all env vars in Vercel (payment + email + Supabase + admin) for
      preview and production. Set `ORDER_STORE=supabase` in production.
- [x] Production checkout fail-closed when required deps are missing
      (`src/lib/config/productionReadiness.ts`, `/api/health`, `/api/readiness`).
- [ ] Create `web/.env.example` manually (blocked by the local env-file guard;
      variables are documented in `README.md`).
- [ ] E2E test (Playwright) for browse → add to cart → checkout → confirmation.
- [ ] Optional: Supabase Auth + MFA for admin (shared `ADMIN_TOKEN` + audit log
      + Upstash rate limits are already in place).
