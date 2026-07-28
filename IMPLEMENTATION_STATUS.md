# Implementation Status — EPH Production Hardening

Assessment date: 2026-07-28  
Scope: repository map before Phase 1 (Bankful callback authentication and reconciliation).

**Phase 1 status: complete**  
**Phase 2 status: complete**  
**Phase 3 status: complete**  
**Phase 4 status: complete**  
**Phase 5 status: complete**  
**Phase 6 status: complete**  
**Phase 7 status: complete**  
**Phase 8 status: complete**  
**Phase 9 status: complete** (unit/integration gaps, Playwright mock-hpp E2E, GitHub Actions CI). Next: Phase 10 (launch checklist sign-off).

## Existing relevant files

### Payments
| Path | Role |
|------|------|
| `src/lib/payments/types.ts` | `PaymentProvider`, charge/refund types |
| `src/lib/payments/index.ts` | Factory: `mock` / `mock-hpp` / `bankful` / `bankful-hpp` |
| `src/lib/payments/bankful.ts` | Direct CAPTURE + HPP redirect; outbound HMAC; refund/cancel |
| `src/lib/payments/mock.ts` | Mock direct + mock HPP |
| `src/app/api/payments/bankful/ipn/route.ts` | HPP IPN callback (**unauthenticated before Phase 1**) |
| `src/app/api/payments/mock-hpp/complete/route.ts` | Dev mock HPP completion |

### Checkout / orders
| Path | Role |
|------|------|
| `src/app/api/checkout/route.ts` | Build order → reserve stock → charge/redirect → persist |
| `src/lib/checkout/order.ts` | Server-side cart → order (catalog prices) |
| `src/lib/orders/types.ts` | `OrderRecord`, `PaymentStatus`, `OrderStore` |
| `src/lib/orders/fileStore.ts` / `supabaseStore.ts` | Persistence backends |
| `src/app/checkout/success/page.tsx` | Success UI (does not load DB status yet) |

### Inventory / admin
| Path | Role |
|------|------|
| `src/lib/inventory/index.ts` | `reserve_stock` / `release_stock` / `adjust_stock` RPCs |
| `src/lib/admin/session.ts` | HMAC httpOnly admin session cookie |
| `supabase/migrations/20260728120000_orders.sql` | Orders schema |
| `supabase/migrations/20260728120100_inventory.sql` | Inventory + stock RPCs |

### Spec docs (non-runtime)
`.cursor/md/CURSOR_IMPLEMENTATION_PLAN.md`, `BANKFUL_AND_INVENTORY_SECURITY_SPEC.md`, `PRODUCTION_LAUNCH_CHECKLIST.md`, `CURSOR_MASTER_PROMPT.md`

---

## Current payment flow

1. `POST /api/checkout` builds the order from catalog prices, reserves stock (if Supabase configured), then calls the selected provider.
2. **Direct** (`mock` / `bankful`): synchronous capture; approved orders persist immediately.
3. **HPP** (`mock-hpp` / `bankful-hpp`): order saved as `pending`, browser redirects to hosted page.
4. Bankful posts asynchronously to `/api/payments/bankful/ipn` (`url_callback`).
5. Browser return URLs go to `/checkout/success` or checkout error pages — **navigation only**; must not approve payment.

Before Phase 1, the IPN route trusted `TRANS_STATUS_NAME` / order id from the body with no signature check, no amount/currency match, and no server reconciliation.

---

## Current order state model

`PaymentStatus`: `pending` | `approved` | `declined` | `refunded` | `partially_refunded` | `cancelled`

`FulfillmentStatus`: `unfulfilled` | `fulfilled` | `cancelled`

**Gaps vs security spec:** missing `expired`, `review_required`; fulfillment missing `processing`, `shipped`. No enforced transition graph in code.

---

## Current inventory model

Immediate decrement via `reserve_stock` (not a separate reservation ledger). Abandoned/declined HPP checkouts can leave stock reduced. No reservation expiry worker. Inventory is skipped when Supabase env is missing (unsafe in production — Phase 3).

---

## Current admin auth model

Shared `ADMIN_TOKEN` password → signed httpOnly cookie (`ADMIN_SESSION_SECRET` or derived). 8-hour TTL, in-memory login rate limit. No MFA / Supabase Auth.

---

## Current test coverage

Present: outbound HPP sign determinism, mock cards, checkout pricing, order stores, admin session/login, inventory helpers, email builders.

Missing (Phase 1 targets): inbound signature verify, amount/currency mismatch, IPN route auth, replay/idempotency, payment event persistence, S2S reconciliation mocks.

---

## Differences vs implementation documents

| Spec requirement | Repository before Phase 1 |
|------------------|---------------------------|
| Authenticated Bankful callbacks | Fail open |
| Constant-time inbound signature verify | Only outbound `signBankfulHppPayload` |
| Amount/currency checks (integer cents) | Missing |
| S2S transaction reconciliation | Missing |
| `payment_events` table / idempotency key | Missing |
| `review_required` on mismatch / illegal transition | Missing |
| Success page authoritative DB status | Always shows approved |
| Inventory reservations + expiry | Decrement-only model |
| Production fail-closed config | Inventory/orders can soft-skip |
| Tax / outbox / rate limits / MFA | Not started |

---

## Proposed migration sequence

1. **Phase 1** — Secure Bankful HPP callbacks (this work)
2. Phase 2 — Pending orders + inventory reservations
3. Phase 3 — Fail-closed production configuration
4. Phase 4 — Durable outbox for paid-order side effects
5. Phase 5 — Checkout / success UX (DB-backed status)
6. Phase 6 — Email + fulfillment notifications
7. Phase 7 — Tax integration
8. Phase 8 — Rate limiting, admin hardening, observability
9. Phase 9 — Broader E2E / integration suite
10. Phase 10 — Launch checklist sign-off

---

## Unknown Bankful documentation requirements

Confirmed from [docs.bankful.com](https://docs.bankful.com/) HPP section:

- Outbound and **response** signing: HMAC-SHA256 with gateway password; alphabetically sorted non-empty `key+value` concatenation; hex digest in `signature` / `SIGNATURE`.
- Callback body fields: `TRANS_STATUS_NAME`, `TRANS_VALUE`, `TRANS_CUR`, `TRANS_ORDER_ID`, `XTL_ORDER_ID`, `TRANS_REQUEST_ID`, `TRANS_RECORD_ID`, `TIMESTAMP`, etc.
- Callbacks are HTTP POST `application/x-www-form-urlencoded`; duplicates must be ignored.

Still unconfirmed / TODO against merchant-specific docs:

- Exact **server-to-server transaction status/query** `transaction_type` (public docs cover CAPTURE / REFUND / AUTH / CANCEL / CAUTH, not a status lookup).
- Whether live IPN always includes every response field shown in docs.
- Whether any merchant uses Invoice webhooks (`X-Bankful-Hmac-SHA256` + API key) instead of/in addition to HPP `url_callback` (different algorithm — not used for HPP IPN).

Phase 1 uses documented HPP response signature verification as authentication, reconciles amount/currency from authenticated callback fields against the stored order, and exposes `verifyBankfulTransaction` with an explicit TODO for a confirmed STATUS API (fail closed when lookup is required but unavailable).
