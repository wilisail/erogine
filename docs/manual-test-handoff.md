# Setup and shopper verification — Blocks 1–5

Current verified Preview: https://erogine-preview-andor2.vercel.app/shop . This stable Preview alias points to the complete storefront. The older account-only deployments have no `/shop` route; do not use them for checkout or AI testing. Keep Production unchanged during these checks.

## Latest checkpoint — 12 November 2026

| Block | Evidence | Remaining user check |
| --- | --- | --- |
| 1 — Auth | Registration and sign-out/sign-in reported successful. Operator-assisted password recovery was implemented, passed 14 hosted checks and was successfully used by the owner. | None for the basic account flow. |
| 2 — PayPal | Owner completed a real PayPal sandbox approval/capture. Stored order is PAID for one Orbit City Cruiser, USD 18; order/capture identifiers are populated. | Separate cancellation test; reload receipt and compare with sandbox transaction history. |
| 3 — Cart | Owner added two SKUs, removed a SKU and reduced quantity; checkout amount matched. Earlier automated browser checks covered search, filters, quantities, empty state and refresh persistence. | Quick refresh-persistence confirmation in the final shopper session. |
| 4 — AI | Preview credentials are saved. A real `openrouter/free` request returned three catalogue products under USD 35 with reasons. See `verification/live-openrouter.json`. | Use Gift finder in the browser and add one recommendation to the cart. |
| 5 — Release | Build and auth/payment/AI boundary checks have passed. | Finish the combined journey, public repository, public YouTube demo and Devpost submission. |

The first two live AI checks received an upstream HTTP 400; the same request configuration subsequently succeeded. No exact cause for those earlier upstream responses was established. Diagnostics redact the API key and interests. Free-provider availability and compatibility can vary; do not claim uninterrupted reliability.

## Saved Preview configuration

These are already configured. Do not paste provider secrets into chat or source control.

| Variable | Value/source |
| --- | --- |
| `PAYPAL_CLIENT_ID` | Sandbox REST app associated with the sandbox Business seller |
| `PAYPAL_CLIENT_SECRET` | Same app; Secret |
| `PAYPAL_ENVIRONMENT` | `sandbox` |
| `OPENROUTER_API_KEY` | API key created in the owner's OpenRouter account; Secret |
| `OPENROUTER_MODEL` | `openrouter/free` |

Keep the existing `DATABASE_URL`, `AUTH_JWT_SECRET` and other auth/database settings. Redeploy the complete checked-in application to Preview after changing configuration. Only move the stable alias after verifying the full shop, auth and required provider flow. Re-deploying an old account-only build does not add storefront features.

PayPal's Sandbox Personal buyer email/password are separate from the Erogine shopper login and the real Developer Dashboard login. Use the virtual Personal buyer in the payment popup. No real funds or shipping are involved.

## Finish Round 4

1. Open the current Preview and sign in using the existing Erogine account.
2. In Gift finder, enter `space and building`, budget USD 35 per item.
3. Request picks. Expect up to three real catalogue products, each within the per-item budget, with relevant reasons.
4. Add a recommendation to the cart and confirm its price/quantity.

The verified API response selected Moon Mission Kit (USD 32), Little City Blocks (USD 24) and Tiny Robot (USD 28). Future free-router responses may choose different valid alternatives.

## Final shopper and submission session

- Refresh the cart and confirm persistence.
- Reload the existing PAID receipt; compare its total and identifiers with the PayPal sandbox dashboard. Do not pay that order again.
- Start a separate checkout and cancel the PayPal popup. Confirm it does not become PAID and the cart remains available. Cancellation is not a refund; refunds are outside this demo.
- If an order is PROCESSING, check that existing order rather than starting another payment.
- Make `wilisail/erogine` public while retaining its MIT license and third-party notices. Git automatic deployment is not connected; previews have been deployed directly from the checked-in source.
- Record the actual AI → cart → PayPal approval/capture → receipt journey. Keep secrets out of the recording.
- Upload a publicly visible YouTube video under three minutes; submit its link, the public repository, working demo and the description from `submission-draft.md` to https://paypalaihackathon.devpost.com/ .

Official deadline: 12 November 2026, noon PST — 13 November, 03:00 WIB. The remaining UI confirmation and submission work are not yet complete.
