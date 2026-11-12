# Submission draft — verify both providers before using

Project name: **Erogine — a little help choosing, a verified way to pay**

Pitch: A small AI-assisted gift shop that turns interests and a budget into a few real catalogue choices, then connects those choices to a PayPal sandbox checkout with a server-verified receipt.

## What it does

Shoppers browse eight demo products or ask the AI gift finder for up to three alternatives within a budget per item. Recommendation cards add the actual products to a persistent cart. Authenticated checkout calculates prices on the server, creates a PayPal order, accepts buyer approval and verifies a completed capture before displaying PAID. The order page distinguishes unpaid, processing, canceled and paid states.

## How we built it

Next.js, React, TypeScript, Prisma, Supabase PostgreSQL, PayPal Orders v2/React SDK and OpenRouter. The auth core is reused from the owner's TemuEvent project. Small PayPal, product-card and quantity-picker components are adapted from Spree's MIT storefront with attribution. New work connects a small catalogue and AI selection to secure order ownership, trusted prices, retry protection and receipt reconciliation.

## What we learned

Buyer approval and completed payment are different events. A timeout can occur after money is captured, so retry safety needs both provider idempotency and a local order lifecycle. AI can help choose products while the payment server remains responsible for prices, authorization and verified status.

## Current limits

Sandbox funds and demo products only; nothing is shipped. No refunds, automatic fulfillment, verified webhooks or production payment mode. Free-model capacity varies. Complete and record real OpenRouter and PayPal sandbox tests before claiming the full journey was verified.

## Suggested video — about two minutes

1. 0:00–0:15: Explain the problem: too many gift choices, uncertain fit to a budget.
2. 0:15–0:45: Enter interests and budget, show real model recommendations and their catalogue prices.
3. 0:45–1:05: Add a recommendation, open the cart and show quantity/total.
4. 1:05–1:40: Approve with the PayPal sandbox buyer and show capture verification and receipt.
5. 1:40–2:00: Reload the receipt; mention safe retries and catalogue-grounded AI. State clearly that this is a sandbox demo.

Use the current deployed URL, the public `https://github.com/wilisail/erogine` repository and your public YouTube link. The official requirements are https://paypalaihackathon.devpost.com/rules .
