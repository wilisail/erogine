# Submission draft

Project name: **Erogine — a little help choosing, a verified way to pay**

Pitch: A small AI-assisted gift shop that turns interests and a budget into a few real catalogue choices, then connects those choices to a PayPal sandbox checkout with a server-verified receipt.

## What it does

Shoppers browse eight demo products or ask the AI gift finder for up to three alternatives within a budget per item. Recommendation cards add actual products to a persistent cart. Authenticated checkout calculates prices on the server, creates a PayPal order, accepts buyer approval and verifies a completed capture before displaying PAID. Private order pages distinguish unpaid, processing, canceled and paid states.

## How we built it

Next.js, React, TypeScript, Prisma, Supabase PostgreSQL, PayPal Orders v2/React SDK and OpenRouter. The requested model is `openrouter/free`, a router whose underlying free model can vary; no paid fallback is enabled. The server validates selected product IDs and budgets against the supplied catalogue.

The auth core is reused from the owner's TemuEvent project. Small PayPal, product-card and quantity-picker components are adapted from Spree's MIT storefront with attribution. New work connects the catalogue and AI selection to order ownership, trusted prices, retry protection and receipt reconciliation. Source notices and licenses are retained.

## What we learned

Buyer approval and completed payment are different events. A timeout can occur after money is captured, so retry safety needs both provider idempotency and a local order lifecycle. AI helps choose products while the payment server remains responsible for prices, authorization and verified status.

## Verified so far

A real USD 18 PayPal sandbox capture produced a server-verified PAID receipt. Real OpenRouter requests produced catalogue recommendations, including browser cards observed by the owner. Automated release checks exercised authentication, access across two accounts, server pricing, repeated checkout, unapproved capture rejection and sandbox cancellation. The final continuous AI-to-payment recording remains to be completed.

## Current limits

Sandbox funds and demo products only; nothing is shipped. No refunds, automatic fulfillment, verified webhooks or production payment mode. Free-provider capacity varies; early upstream errors did not have an established root cause. Do not claim uninterrupted reliability or production readiness.

## Video outline — about two minutes

1. **0:00–0:15:** “Erogine helps shoppers choose a gift within their budget, then pay through a verified PayPal checkout. This is a sandbox demo using virtual funds.”
2. **0:15–0:45:** Enter `soft toy` and type `24` as the USD budget per item. Request real recommendations. Show the selected catalogue products and prices.
3. **0:45–1:05:** Add one recommendation, open the cart and show its quantity and total.
4. **1:05–1:40:** Open checkout, approve with the Sandbox Personal buyer and show “Payment verified” and PAID. Keep logins, credentials and developer dashboards out of the recording.
5. **1:40–2:00:** Reload the receipt and show the order in My account. “The server verifies the capture and amount before marking the order paid. AI helps select products; the payment system controls the price and payment status.”

Record the actual successful journey. If the free model errors, retry before recording. Never edit an error into an invented success.

## Links and submission

- Demo: https://erogine-preview-andor2.vercel.app/shop
- Repository: https://github.com/wilisail/erogine — still private at the release checkpoint; make it public before submitting, retaining MIT and third-party notices.
- Video: replace with the **public** YouTube link after upload; keep the video **under three minutes**.
- Submit the description and all three links at https://paypalaihackathon.devpost.com/ .

Official deadline: 12 November 2026, noon PST — **13 November, 03:00 WIB**. Requirements: https://paypalaihackathon.devpost.com/rules . Recheck the form before final submission.
