# Store — remaining work

Follow-ups to take the Bankful checkout store from working demo to production.
Ordered roughly by priority.

## Payments / go-live
- [ ] Obtain Bankful **sandbox** credentials; set `PAYMENT_PROVIDER=bankful` +
      `BANKFUL_USERNAME` / `BANKFUL_PASSWORD` and re-test with sandbox test cards.
- [ ] Complete Bankful **live** merchant onboarding; swap `BANKFUL_API_BASE_URL`
      to `https://api.paybybankful.com` and use live credentials.
- [ ] **Hosted Payment Page (HPP)** provider for production. The current on-site
      card form puts us in **PCI DSS SAQ D** scope. Add a `bankful-hpp` provider
      that returns `{ kind: "redirect", url }` so card entry happens on Bankful's
      PCI-compliant page (SAQ A). The checkout API already supports the redirect
      outcome — only a new provider + return/callback route are needed.
- [ ] Handle Bankful HPP return + postback/IPN (verify status server-side before
      confirming the order).
- [ ] Refunds / cancellations (Bankful supports `REFUND` and `CANCEL`) — admin
      action or support workflow.

## Catalog / pricing
- [ ] Replace PLACEHOLDER variant prices/sizes in `src/data/products.ts`:
      BP-3R 30mg, BP-2T 20mg, MOTS-c (sizes + prices), Tesamorelin 5mg,
      BAC (sizes + prices). (Search the file for `PLACEHOLDER`.)
- [ ] Confirm real shipping rates (currently flat $12, free at $150) and whether
      international shipping is offered.
- [ ] Sales tax handling (none today).
- [ ] Inventory / stock status per variant (no stock tracking today).

## Orders / email
- [ ] Set up Resend: verify sending domain, set `EMAIL_PROVIDER=resend`,
      `RESEND_API_KEY`, `EMAIL_FROM`.
- [x] Persist orders — approved orders are saved via the order store
      (`src/lib/orders`), viewable at `/admin/orders?key=ADMIN_TOKEN`.
- [ ] Move the order store from the JSON file (`ORDER_STORE=file`, not durable
      on serverless) to a real database (e.g. Supabase). Add a `supabase` /
      `db` implementation of `OrderStore`.
      DEFERRED (2026-07-14): the JSON file store is not durable on Vercel, but
      every order is also captured by the store-notification email + Bankful's
      dashboard, so this is acceptable for launch. Revisit before relying on the
      in-app `/admin/orders` history in production or under real traffic.
- [ ] Replace the `ADMIN_TOKEN` query-key guard on `/admin/orders` with proper
      authentication before production.
- [ ] Shipping/tracking notification email once a label is created.

## Trust / compliance
- [ ] Keep "Research Use Only" disclaimers on every product + checkout page
      (required by high-risk underwriting).
- [ ] Review refund/terms/privacy pages against the live payment flow.

## Infra / QA
- [ ] Set all env vars in Vercel (payment + email) for preview and production.
- [ ] Create `web/.env.example` manually (blocked by the local env-file guard;
      variables are documented in `README.md`).
- [ ] E2E test (Playwright) for browse → add to cart → checkout → confirmation.
