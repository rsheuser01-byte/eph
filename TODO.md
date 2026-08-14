# Store — remaining work

Follow-ups to take the Stripe checkout store from working demo to production.
Ordered roughly by priority.

## Payments / go-live
- [ ] Set Stripe **test** keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) and
      `PAYMENT_PROVIDER=stripe` / `NEXT_PUBLIC_PAYMENT_PROVIDER=stripe`; complete a
      test Checkout (card `4242 4242 4242 4242`).
- [ ] Register production webhook `{SITE}/api/payments/stripe/webhook` for
      Checkout Session events; switch to **live** keys before taking real orders.
- [x] **Stripe Checkout** hosted provider (`stripe`) + webhook at
      `/api/payments/stripe/webhook`. Hosted page keeps PCI scope at SAQ A.
- [x] Webhook signature verification, amount/currency reconciliation (cents),
      callback idempotency via `payment_events`, and `review_required` on mismatch.
- [x] Refunds / cancellations — admin refund action + Stripe refunds (and mock).
      Restock when fulfillment is still `unfulfilled`.

## Catalog / pricing
- [ ] Replace PLACEHOLDER variant prices/sizes in `src/data/products.ts`
      (search the file for `PLACEHOLDER`) — **blocks go-live** (see LAUNCH_READINESS).
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
- [x] "Research Use Only" acknowledgment required client-side **and** on
      `POST /api/checkout` (`researchUseAcknowledged: true`). Keep disclaimers
      on product pages (underwriting).
- [ ] Review refund/terms/privacy pages against the live payment flow.
- [x] BAC Water removed from catalog (FDA compliance).

## Infra / QA
- [ ] Set all env vars in Vercel (payment + email + Supabase + admin + TaxJar +
      Upstash) for preview and production. Set `ORDER_STORE=supabase` in production.
- [x] Production checkout fail-closed when required deps are missing
      (`src/lib/config/productionReadiness.ts`, `/api/health`, `/api/readiness`).
- [ ] Create `web/.env.example` manually (blocked by the local env-file guard;
      variables are documented in `README.md`).
- [x] E2E test (Playwright) for browse → add to cart → checkout → confirmation
      (`npm run test:e2e`, mock-hpp).
- [x] CI: GitHub Actions runs lint, unit tests, build, and Playwright.
- [x] Phase 10 launch readiness: see [`LAUNCH_READINESS.md`](./LAUNCH_READINESS.md)
      for CODE vs OPS vs BLOCKED checklist sign-off.
- [ ] Optional: Supabase Auth + MFA for admin (shared `ADMIN_TOKEN` + audit log
      + Upstash rate limits are already in place).
