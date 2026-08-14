# Launch Readiness — Phase 10 Sign-off

Assessment date: 2026-07-28  
Scope: evidence-backed status for [PRODUCTION_LAUNCH_CHECKLIST.md](../.cursor/md/PRODUCTION_LAUNCH_CHECKLIST.md) and Phase 10 of the hardening plan.

**Legend**

| Status | Meaning |
|--------|---------|
| **CODE** | Implemented and covered by automated tests (or verified in config/code) |
| **OPS** | Requires merchant / ops / advisor action before go-live |
| **BLOCKED** | Must be resolved before accepting live traffic |

**Go-live authorization:** not granted until every **BLOCKED** item is cleared and Launch sign-off rows below are signed.

---

## Critical blockers

| Item | Status | Evidence / next action |
|------|--------|------------------------|
| Stripe account can accept card payments | **OPS** | Activate Stripe; enable card methods in Dashboard |
| Production uses `stripe` | **CODE** | `productionReadiness.ts` + payment factory reject mock/on-site capture |
| Direct card entry disabled in production | **CODE** | UI hides card fields for hosted Stripe Checkout |
| Webhook signatures verified | **CODE** | Stripe-Signature on `/api/payments/stripe/webhook` |
| Amount/currency verified (cents) | **CODE** | `money.ts` + webhook mismatch → `review_required` |
| Callback replay tests pass | **CODE** | `payment_events` uniqueness + webhook idempotency test |
| S2S transaction reconciliation | **CODE** | Webhook retrieves Checkout Session from Stripe API |
| Pending reservations expire | **CODE** | Cron `/api/cron/expire-reservations` + reservation RPCs |
| Decline/cancel release inventory once | **CODE** | IPN + expire paths; tests |
| Production fails closed without Supabase | **CODE** | `assertProductionCheckoutReady` + checkout 503 |
| Paid orders durable before fulfillment side effects | **CODE** | Outbox enqueue after approve; no inline email |
| Placeholder product data removed | **CODE** | BAC Water removed from catalog (FDA compliance) |
| Production email configured | **OPS** | Resend domain + `EMAIL_PROVIDER=resend` + keys on Vercel |
| Sales tax configured | **OPS** | TaxJar account, nexus, advisor; code requires `taxjar` in production |
| Full checkout E2E tests pass | **CODE** | Playwright `tests/e2e/checkout.spec.ts` (mock-hpp) |

---

## Payments (Phase 10 plan)

| Item | Status | Notes |
|------|--------|-------|
| Stripe account / card payments enabled | **OPS** | |
| Test-mode Checkout completed | **OPS** | Card `4242…4242` |
| Live keys + webhook endpoint | **OPS** | |
| `PAYMENT_PROVIDER=stripe` | **CODE** enforced; **OPS** to set in Vercel | |
| Direct card-capture disabled | **CODE** | |
| Signature verification | **CODE** | |
| S2S reconciliation | **CODE** | Retrieve Checkout Session on webhook |
| Amount/currency checks | **CODE** | |
| Duplicate callback tests | **CODE** | |
| Refund + cancellation tests | **CODE** | Admin refund route tests + Stripe refunds |

---

## Orders and inventory

| Item | Status | Notes |
|------|--------|-------|
| Supabase production migrations applied | **OPS** | Confirm all 10 migrations on live project |
| Service-role key server-side | **OPS** | Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel (never client) |
| Starting inventory entered | **OPS** | `/admin/inventory` — seeded at 0 |
| Reservation expiration enabled | **CODE** + **OPS** cron schedule | Vercel cron + `CRON_SECRET` |
| Concurrent final-unit protection | **CODE** | SQL `FOR UPDATE` in reservation RPC |
| Paid orders commit stock once | **CODE** | |
| Declined/cancelled/expired release once | **CODE** | |
| Production inventory fails closed | **CODE** | |

---

## Catalog

| Item | Status | Notes |
|------|--------|-------|
| `PLACEHOLDER` values removed | **CODE** | BAC Water removed from catalog |
| All SKUs unique | **CODE** | `products.test.ts` |
| Prices / vial sizes / shipping confirmed | **OPS** | Flat $12, free ≥ $150 in `pricing.ts` |
| Free-shipping threshold confirmed | **OPS** | |
| Product availability verified | **OPS** | Depends on inventory seed |
| Disclaimers on product + checkout | **CODE** | Server requires `researchUseAcknowledged: true` |

---

## Email

| Item | Status | Notes |
|------|--------|-------|
| Sending domain verified | **OPS** | Resend |
| Customer confirmation / store notify / refund / shipping | **CODE** | Outbox handlers |
| Retry worker tested | **CODE** | `/api/cron/process-outbox` + unit tests |
| Critical-failure alert tested | **OPS** | Exercise with failed outbox + optional `SENTRY_DSN` |

---

## Tax

| Item | Status | Notes |
|------|--------|-------|
| Tax provider selected | **CODE** | TaxJar |
| Registration obligations reviewed | **OPS** | Advisor |
| Production tax calculation enabled | **CODE** gated; **OPS** credentials | |
| Address-change recalculation | **CODE** | Checkout UI + server re-quote |
| Refund tax treatment | **OPS** | Confirm accounting policy with advisor |

---

## Security and operations

| Item | Status | Notes |
|------|--------|-------|
| Admin MFA | **OPS** / optional | Shared `ADMIN_TOKEN` + audit + rate limits; IdP+MFA before multi-staff |
| Rate limits enabled | **CODE** | Upstash required in production |
| Audit logs enabled | **CODE** | `admin_audit_log` |
| Sentry or equivalent | **OPS** | Optional `SENTRY_DSN` (minimal emit) |
| Security headers verified | **CODE** | CSP + HSTS in `next.config.ts` |
| Secrets reviewed | **OPS** | No secrets in `NEXT_PUBLIC_*` except public URL/provider/Supabase URL |
| Backup and recovery tested | **OPS** | Supabase backups |
| Policies reviewed | **OPS** | Privacy, terms, shipping, refunds |
| No prohibited health claims | **OPS** | Content review before launch |

---

## Final live test (must complete before public launch)

| Item | Status |
|------|--------|
| Low-value live transaction | **OPS** |
| Order appears in admin | **OPS** |
| Inventory updates | **OPS** |
| Confirmation email arrives | **OPS** |
| Refund succeeds + email | **OPS** |
| Inventory restocks per policy | **OPS** |
| Stripe dashboard matches internal order | **OPS** |

---

## Environment checklist (set on Vercel production)

Copy from README; verify via authenticated `GET /api/readiness`:

- [ ] `NODE_ENV` / Vercel production
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `PAYMENT_PROVIDER=stripe`
- [ ] `NEXT_PUBLIC_PAYMENT_PROVIDER=stripe`
- [ ] `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- [ ] `ORDER_STORE=supabase`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `ADMIN_TOKEN` + `ADMIN_SESSION_SECRET`
- [ ] `EMAIL_PROVIDER=resend` + `RESEND_API_KEY` + `EMAIL_FROM`
- [ ] `STORE_NOTIFICATION_EMAIL` (optional)
- [ ] `TAX_PROVIDER=taxjar` + `TAXJAR_API_TOKEN` + `TAX_FROM_*`
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
- [ ] `CHECKOUT_RESERVATION_MINUTES` + `CRON_SECRET`
- [ ] `SENTRY_DSN` (optional)
- [ ] Crons: expire-reservations, process-outbox

---

## Automated verification (engineering)

```bash
cd web
npm ci
npm run lint
npm run test
npm run build
npm run test:e2e
```

CI: `.github/workflows/ci.yml` (lint → vitest → build → Playwright).

---

## Launch sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Business owner | | | |
| Payment processing | | | |
| Technical | | | |
| Tax / accounting | | | |
| Policy / compliance | | | |

**First live order monitored end-to-end:** ☐ yes — date/order id: ________

---

## Definition of done (engineering phases 1–9)

| Criterion | Met in code? |
|-----------|----------------|
| Stripe Checkout only live card-entry path | Yes (enforced) |
| Payment approval authenticated + reconciled | Yes (webhook + Session retrieve) |
| Reservations cannot stick forever | Yes (expire cron) |
| Callback replay cannot duplicate side effects | Yes |
| Paid orders durable if email fails | Yes (outbox) |
| Production fails closed | Yes |
| Taxes calculated server-side | Yes (TaxJar) |
| Critical paths have automated tests | Yes (gaps: live Stripe) |
| Admin authenticated + audited | Yes (MFA optional) |
| Live transaction + refund tested | **No — OPS** |
