# Round 2 — PayPal payment companion

This round adds one USD 18 product, authenticated sandbox checkout and a server-verified receipt. Keeping the shop small lets us study payment behavior before adding the AI recommender. No real funds or shipping are supported.

## What happens when someone pays

1. The browser sends product IDs, quantities and a random checkout key. It cannot submit prices, currency, customer IDs or a paid flag. The server reads the catalogue and computes integer cents: two USD 18 items cost `2 × 1800 = 3600` cents.
2. The verified login identifies the customer. The server saves an order and item snapshots in the private `erogine` schema. Prices on that order remain the basis for subsequent checks.
3. The server obtains a short-lived PayPal OAuth token using its client ID and secret. Only the client ID is intentionally public for the PayPal button. The secret and OAuth token stay on the server.
4. The server creates a PayPal order and stores its ID beside the local order ID. They are different records: Erogine owns the shopping record; PayPal owns the payment record.
5. The buyer approves in PayPal. **Approval is permission to proceed; it is not our proof of payment.** The browser calls Erogine's capture endpoint. That endpoint reads the stored PayPal ID rather than accepting a replacement ID from the browser.
6. Before capture, the server checks ownership and reads the PayPal order. After capture, it retrieves the order again and verifies the order ID, local reference, USD currency, exact total and capture ID. Only a matching `COMPLETED` capture produces `PAID`.
7. The receipt reads Erogine's database. Neither a URL parameter nor a frontend success message can mark it paid.

## Retries, cancellation and uncertain results

| State | Meaning | Behavior |
| --- | --- | --- |
| PENDING | No completed capture verified | Buyer may approve or cancel |
| PROCESSING | Capture is underway, pending or uncertain | Check status before paying again |
| PAID | Matching completed capture verified | Show receipt; never recapture |
| CANCELED | Local unpaid checkout canceled | Start a new checkout if wanted |
| FAILED | Reserved failure state | Never treat as paid |

A unique checkout key prevents a retried cart request from creating a second local order. Each local order also generates stable, separate `PayPal-Request-Id` values for create and capture. PayPal's idempotency guarantees depend on the operation and its retention window; our database does not assume unlimited provider retention.

A conditional database update claims the capture only if the saved status and update time still match the snapshot. Two simultaneous clicks therefore cannot both start capture immediately. No database transaction stays open during an external API call.

A timeout can happen **after** PayPal accepted the payment. We query PayPal again before reporting a result. If that still fails, the order remains `PROCESSING`; an explicit status check can recover it. An immediate capture retry waits, while a later retry first checks PayPal and reuses the same operation key. This is duplicate protection, not a promise of distributed “exactly once” execution.

Cancellation checks PayPal first and updates only an unpaid local order. Canceling a checkout is not a refund, and this build has no refund endpoint. Browser origin checks, a current-session CSRF token, server-derived ownership and strict request bodies protect payment mutations. Another customer receives a generic 404 for an inaccessible receipt.

## The same learning applied to Stripe

| What we built | PayPal here | Later Stripe implementation |
| --- | --- | --- |
| Trusted cart and customer | Server catalogue + login | Keep the same rules |
| Local shopping record | `erogine.orders` and items | Keep the local record; add Stripe IDs |
| Provider checkout reference | PayPal order ID | Checkout Session ID, usually linked to a PaymentIntent |
| Buyer interaction | PayPal approval window | Stripe Checkout and any authentication required |
| Proof of payment | Verified completed capture | Verify paid status / successful PaymentIntent; a redirect or completed session alone is insufficient for delayed methods |
| Retry identity | `PayPal-Request-Id` | `Idempotency-Key`, following Stripe's operation-specific rules |
| Duplicate local updates | Unique IDs + conditional updates | Reuse the same database approach |
| Recovery | Retrieve provider order | Retrieve Checkout Session / PaymentIntent |
| Server notifications | Not implemented in this round | Add verified webhooks and deduplicate event/fulfillment handling |
| Cancel vs refund | Separate concepts | Keep separate operations |

The reusable part is the order lifecycle and its checks. Provider API calls, credentials, payment statuses and webhook signature verification must be implemented for each provider. Replacing the PayPal button alone would not complete a Stripe integration.

## Setup and the remaining real sandbox test

1. Sign in at https://developer.paypal.com/ and open **Apps & Credentials → Sandbox**. Create or select a REST app tied to a sandbox business account.
2. In the Erogine Vercel project's **Settings → Environment Variables**, add `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` and `PAYPAL_ENVIRONMENT=sandbox` for **Preview**, then redeploy Preview. Keep the secret in Vercel, not in chat or Git. The existing database/auth configuration stays in that environment.
3. In **Testing Tools → Sandbox Accounts**, obtain a separate personal buyer account. Use its sandbox credentials in the PayPal window, not the real account that signs into the developer dashboard.
4. Open `/checkout`, approve one item, and compare the local order ID, PayPal order ID, capture ID, USD 18 total and `PAID` receipt with the sandbox dashboard. Reload the receipt and confirm the stored result survives.
5. Test a canceled approval separately. Re-check an already paid order and confirm there is one capture. Keep the demonstration sandbox-only.

The automated provider fixtures in unit tests never reach PayPal and are not deployable payment-success modes. Hosted tests use generated example.test accounts and unpaid database fixtures, then remove them. Real OAuth, the PayPal popup, buyer approval and capture remain unverified until credentials are configured.

## Scope and source reuse

The auth service is reused from the owner's TemuEvent F2. The small React PayPal adapter is adapted from Spree's MIT storefront, with its notice retained in `licenses/spree-MIT.txt`. The payment service and provider wrapper are small new modules; no second commerce backend was imported. See `THIRD_PARTY_NOTICES.md`.

This is a sandbox learning prototype. Verified webhooks, automatic fulfillment, refunds, disputes, inventory reservations and scheduled reconciliation are later work. A buyer closing the browser before capture is not a paid order; a completed capture can be recovered through a status check if it reached PayPal. Production fulfillment needs authenticated provider notifications and duplicate-safe fulfillment, independent of the browser returning.

The hackathon requires meaningful PayPal and AI use, a runnable demo, public open-source repository and a short public YouTube demo. This payment round alone does not complete the submission. The AI recommender and submission assets follow separately.

## Verification checkpoint

- 28 unit tests passed, including 14 payment tests with injected provider responses and 14 existing auth tests.
- TypeScript checks and the production build passed.
- 29 hosted payment-boundary checks passed against the actual Preview deployment: authenticated configuration, private owner receipts, anonymous/foreign access denial, invalid IDs, strict action bodies, origin/application/CSRF guards, protected checkout rendering and fail-closed behavior without PayPal credentials.
- Two generated example.test accounts and two unpaid fixtures were removed. Database verification confirmed zero remaining QA users, orders or sessions and no extra orders created by disabled checkout.
- All five Erogine tables retain RLS; the runtime role can read no tables in TemuEvent's public schema and has neither superuser nor BYPASSRLS privileges.
- Verified Preview: https://erogine-izk7da32z-andor2.vercel.app/ (Vercel target `staging` / Preview). Source code: commit `3ac11d23000ca770f3f956b8c90e8f05f496429d`.
- Checkpoint completed 12 November 2026, approximately 08:42 WIB. The Preview was deployed directly from these source files; Git automatic deployment access still needs connecting.
- Real PayPal sandbox transaction: pending credentials and buyer approval.

## Official references

- [PayPal Orders v2](https://developer.paypal.com/api/orders/v2)
- [PayPal capture operation](https://developer.paypal.com/api/orders/v2/orders-capture)
- [PayPal idempotency](https://developer.paypal.com/api/rest/reference/idempotency/)
- [PayPal sandbox accounts](https://developer.paypal.com/sandbox-testing/overview)
- [Stripe Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment)
- [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [PayPal AI Hackathon rules](https://paypalaihackathon.devpost.com/rules)
