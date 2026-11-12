# One setup and testing session — Blocks 1–5

Automated work continues without these steps. Complete this sequence when ready; no account creation, secret sharing or buyer approval is needed from you during the automated phase. Never paste provider secrets into chat.

Current verified Preview: https://erogine-nfyrgqmx1-andor2.vercel.app/shop . The address may change after redeploying with credentials.

## 1. Configure both providers together

Use the existing Erogine project in the ANDOR / `andor2` Vercel workspace. Keep the database/auth variables already configured for **Preview**. Add the following variables to **Preview**, then redeploy the latest Preview once. Use the resulting Preview URL for testing; do not switch to the earlier Production deployment.

| Variable | Where the value comes from |
| --- | --- |
| `PAYPAL_CLIENT_ID` | https://developer.paypal.com/ → Apps & Credentials → Sandbox REST app tied to a sandbox business account |
| `PAYPAL_CLIENT_SECRET` | The same sandbox REST app; save as a sensitive server variable |
| `PAYPAL_ENVIRONMENT` | `sandbox` |
| `OPENROUTER_API_KEY` | Your OpenRouter account → API keys at https://openrouter.ai/settings/keys ; save as a sensitive server variable |
| `OPENROUTER_MODEL` | `openrouter/free` |

In PayPal Developer → Testing Tools → Sandbox Accounts, obtain a separate **personal buyer** account. Use that virtual buyer in the payment popup. Your real PayPal dashboard login and the sandbox buyer credentials serve different purposes.

Both provider calls remain unverified until this setup is complete. OpenRouter's free capacity can be busy; an error is shown instead of silently switching to a paid model.

## 2. Follow one shopper journey

| Block | Your check | Expected result | Approximate active time |
| --- | --- | --- | --- |
| 1 | Create an Erogine account with a 15+ character passphrase; sign out and sign in | Private account works; no email verification is required by this demo | 3–5 min |
| 3 | Open Shop, search `wood`, change categories, open a product; add two cruisers and one pocket puzzle | Cart persists after refresh and shows USD 48 total | 5–8 min |
| 4 | Gift finder: interests `space and building`, budget USD 35 per item | Up to three actual catalogue alternatives, each at most USD 35, with relevant reasons; Add to cart works | 3–5 min |
| 2 | Check your cart total, continue to checkout and approve with the sandbox buyer | Receipt becomes PAID only after capture verification; correct USD total and PayPal order/capture IDs appear | 5–10 min |
| 5 | Reload the receipt and compare IDs/amount with the PayPal sandbox dashboard | Stored PAID result persists and there is one completed capture for that order | 3–5 min |
| 2 + 5 | Start a separate checkout and cancel the PayPal popup | Checkout is canceled without a PAID receipt; cart is retained | 2–4 min |

If checkout reports PROCESSING, check the existing order from your account. Do not start another payment for it. Cancellation is separate from a refund; refunds are outside this demo.

Set aside roughly 30–45 minutes after provider accounts are available. New account verification can add time. The backend already automates auth, price/ownership/CSRF validation and controlled duplicate/timeout tests; you do not need to reproduce those low-level requests manually.

## 3. Final submission work

- Make `wilisail/erogine` public and retain its MIT license and third-party notices. It is still private at the implementation checkpoint.
- Give the Vercel Git integration access to Erogine when convenient. Current previews are deployed directly from the checked-in source; Git automatic deployment is not yet connected.
- Record the real AI → cart → PayPal approval/capture → receipt journey after the two provider tests pass. Keep secrets and real account credentials out of the recording.
- Upload a publicly visible YouTube demo under three minutes, then provide that link, the public repo, the working demo and the description in Devpost. A draft is in `docs/submission-draft.md`.
- The official deadline is 12 November 2026, noon PST: **13 November, 03:00 WIB**. Check https://paypalaihackathon.devpost.com/ before submitting.

The automated checks do not prove a real PayPal transaction or a real AI inference. Those two provider steps and the recording/submission remain the final user-dependent checks.
