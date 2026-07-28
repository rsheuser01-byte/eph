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
| Bankful approved exact catalog / business model | **OPS** | Merchant underwriting with Bankful |
| Production uses `bankful-hpp` | **CODE** | `productionReadiness.ts` + payment factory reject mock/direct in production |
| Direct card entry disabled in production | **CODE** | Same; UI hides card fields when `NEXT_PUBLIC_PAYMENT_PROVIDER=*-hpp` |
| Callback signatures verified | **CODE** | `bankfulCallback.ts`, IPN route tests |
| Amount/currency verified (cents) | **CODE** | `money.ts` + IPN mismatch → `review_required` |
| Callback replay tests pass | **CODE** | `payment_events` uniqueness + IPN idempotency test |
| S2S transaction reconciliation | **OPS** / partial | Callback-authenticated reconcile works; set `BANKFUL_STATUS_TRANSACTION_TYPE` after Bankful confirms STATUS type |
| Pending reservations expire | **CODE** | Cron `/api/cron/expire-reservations` + reservation RPCs |
| Decline/cancel release inventory once | **CODE** | IPN + expire paths; tests |
| Production fails closed without Supabase | **CODE** | `assertProductionCheckoutReady` + checkout 503 |
| Paid orders durable before fulfillment side effects | **CODE** | Outbox enqueue after approve; no inline email |
| Placeholder product data removed | **BLOCKED** | BAC Water variants still marked `PLACEHOLDER` in `src/data/products.ts` — confirm size/price with owner |
| Production email configured | **OPS** | Resend domain + `EMAIL_PROVIDER=resend` + keys on Vercel |
| Sales tax configured | **OPS** | TaxJar account, nexus, advisor; code requires `taxjar` in production |
| Full checkout E2E tests pass | **CODE** | Playwright `tests/e2e/checkout.spec.ts` (mock-hpp) |

---

## Payments (Phase 10 plan)

| Item | Status | Notes |
|------|--------|-------|
| Bankful merchant account / catalog approval | **OPS** | |
| Sandbox credentials tested | **OPS** | |
| Live credentials configured | **OPS** | |
| `PAYMENT_PROVIDER=bankful-hpp` | **CODE** enforced; **OPS** to set in Vercel | |
| Direct card-capture disabled | **CODE** | |
| Signature verification | **CODE** | |
| S2S reconciliation | **OPS** to confirm STATUS type | |
| Amount/currency checks | **CODE** | |
| Duplicate callback tests | **CODE** | |
| Refund + cancellation tests | **CODE** | Admin refund route tests + outbox/IPN coverage |

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
| `PLACEHOLDER` values removed | **BLOCKED** | BAC-10ML / BAC-30ML |
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
| No prohibited health claims | **OPS** | Content review before Bankful / launch |

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
| Bankful dashboard matches internal order | **OPS** |

---

## Environment checklist (set on Vercel production)

Copy from README; verify via authenticated `GET /api/readiness`:

- [ ] `NODE_ENV` / Vercel production
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `PAYMENT_PROVIDER=bankful-hpp`
- [ ] `NEXT_PUBLIC_PAYMENT_PROVIDER=bankful-hpp`
- [ ] `BANKFUL_*` (+ optional `BANKFUL_STATUS_TRANSACTION_TYPE`)
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
| Bankful HPP only live card-entry path | Yes (enforced) |
| Payment approval authenticated + reconciled | Yes (STATUS type ops) |
| Reservations cannot stick forever | Yes (expire cron) |
| Callback replay cannot duplicate side effects | Yes |
| Paid orders durable if email fails | Yes (outbox) |
| Production fails closed | Yes |
| Taxes calculated server-side | Yes (TaxJar) |
| Critical paths have automated tests | Yes (gaps: live Bankful) |
| Admin authenticated + audited | Yes (MFA optional) |
| Live transaction + refund tested | **No — OPS** |
