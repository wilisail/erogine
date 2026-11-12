# Current shopper and submission checklist — Blocks 1–5

Use the stable Preview: https://erogine-preview-andor2.vercel.app/shop . The full app is here; earlier account-only deployment URLs are obsolete. Production is unchanged.

## Status — 12 November 2026

| Round | Confirmed evidence | Remaining |
| --- | --- | --- |
| 1 — Account | Registration, sign-in and password recovery worked; 26 hosted auth checks passed. | None for the basic flow. |
| 2 — PayPal | Actual USD 18 sandbox capture and PAID receipt. Release checks also created, reconciled and canceled an unapproved sandbox order. | Quick popup-cancel check and receipt reload in the final session. |
| 3 — Cart | Owner tested two SKUs, removal, quantity reduction and correct total. Automated browser check confirmed refresh persistence on the release build. | None for these cart mechanics. |
| 4 — AI | Real OpenRouter API and owner browser recommendations worked. `soft toy` with USD 24 returned products within budget. Budget typing fixed and checked with `$24.50`. | Add a recommendation to the cart during the recorded journey. |
| 5 — Release | 40 unit, 26 hosted auth and 63 hosted release checks passed; build/typecheck passed; audit found zero known production vulnerabilities. | Final browser checks, public repo, public YouTube demo and Devpost submission. |

## Final quick check — about 3–5 minutes

1. Sign in to the stable Preview with the **Erogine shopper account**. Use the gift finder: interests `soft toy`, type `24` for USD per item; request picks.
2. Add one recommendation; confirm its price and cart total.
3. Start a PayPal checkout, then cancel/close that new popup. Confirm no PAID receipt appears and the cart remains. Do not cancel or pay the earlier completed order.
4. If an order is PROCESSING, check that existing order instead of starting another payment.

Then record the complete AI → cart → successful sandbox payment → PAID receipt → reload/My account flow. The recording can double as the final end-to-end test.

## Account and environment reminders

PayPal Sandbox Personal buyer credentials are separate from the Erogine shopper login and the real PayPal Developer login. Use the virtual buyer in the popup.

Preview already has `DATABASE_URL`, `AUTH_JWT_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENVIRONMENT=sandbox`, `OPENROUTER_API_KEY` and `OPENROUTER_MODEL=openrouter/free`. No additional key or redeploy is needed now. The application accepts only free model configuration; no paid fallback is enabled. The underlying model chosen by OpenRouter's free router can vary.

Early upstream OpenRouter HTTP 400 errors were followed by successful calls without an established root cause. Free-provider capacity can vary.

## Submit

1. Use https://github.com/wilisail/erogine/settings to change repository visibility from Private to Public. Keep the MIT license and third-party notices. Publishing the repo is still the owner's action.
2. Follow the approximately two-minute outline in [submission-draft.md](submission-draft.md). Upload the video as **Public**, **under three minutes**, and check it opens while signed out.
3. On https://paypalaihackathon.devpost.com/ submit the project description, working demo URL, public repo and public YouTube link. Open the demo and repo signed out to check access.
4. Final submission is not complete until Devpost confirms it.

Deadline: **13 November 2026, 03:00 WIB** (12 November, noon PST). Source: https://paypalaihackathon.devpost.com/rules .

Images and further AI experimentation are optional follow-up work; they do not hold up this payment-learning submission.
