# Erogine

A small payment-learning project for the PayPal AI Hackathon. Intended journey: catalogue-grounded AI recommendation → cart → PayPal sandbox checkout → verified order.

## Current build

Implemented: shared shop/account theme, registration with immediate sign-in, persisted sessions, refresh rotation, sign-out, protected order history, one-product PayPal sandbox checkout, server-priced order creation, capture verification, retry protection, cancellation and status reconciliation. AI remains a later block. There is no simulated payment-success mode.

Stack: Next.js 16, React 19, TypeScript, Prisma 7, Supabase PostgreSQL and Vercel. One application; no separate Express deployment. The auth core is reused from the owner's TemuEvent Feature 2; the small PayPal React adapter is adapted from Spree's MIT storefront. See [source notices](THIRD_PARTY_NOTICES.md), [Block 1 notes](docs/block-1.md) and [Round 2 payment companion notes](docs/block-2.md).

## Run

Use Node.js 22.12 or newer.

```sh
npm ci
cp .env.example .env.local
```

Set `DATABASE_URL` to a dedicated PostgreSQL login restricted to the `erogine` schema. Set `AUTH_JWT_SECRET` to a fresh 64-character hexadecimal secret. Use the ignored local env file or server-only Vercel secrets.

For a new database, an administrator creates the `erogine_app` login with its own password, then applies `database/001_foundation.sql` and `database/002_payment_processing.sql` in that order. Do not grant it ownership, BYPASSRLS or access to other applications. Erogine does not use Supabase's browser Data API.

```sh
npm run db:generate
npm run dev
```

Open http://localhost:3000. Create an account with a passphrase of at least 15 characters. Set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` and `PAYPAL_ENVIRONMENT=sandbox` from your own Sandbox REST app, restart, and open `/checkout`. Approve with a separate sandbox personal buyer account. These are virtual funds; nothing is shipped. Without keys the checkout honestly reports that setup is pending. See the companion notes for the test sequence and safe configuration steps.

## Verify

```sh
npm test
npm run typecheck
npm run build
npm run db:check
```

The database check additionally tests isolation from TemuEvent when using the shared learning database. On a standalone database, omit that TemuEvent-specific check.

Vercel uses `npm ci` and `npm run build`. Set `DATABASE_URL`, `AUTH_JWT_SECRET` and PayPal credentials in the chosen environment (Preview for this exercise), then redeploy that environment. No provider secret belongs in Git or a `NEXT_PUBLIC_` variable. The API is sandbox-only. Tests use isolated, injected provider fixtures; a passed test is not evidence of a real PayPal sandbox transaction. Verified webhooks, automatic fulfillment, refunds and live-money support are outside this build.

MIT licensed; retain source notices.
