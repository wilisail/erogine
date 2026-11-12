# Erogine

A small AI-assisted gift shop for the PayPal AI Hackathon: catalogue-grounded recommendations → persistent cart → PayPal sandbox checkout → server-verified receipt.

## Working demo

https://erogine-preview-andor2.vercel.app/shop

Create an Erogine account to use the gift finder and checkout. Use a separate PayPal **Sandbox Personal buyer** in the payment popup. All funds are virtual; nothing is shipped.

The owner completed a real USD 18 sandbox payment and received a PAID receipt. Real OpenRouter calls and browser recommendation cards also worked. Release checks cover authentication, server prices, order ownership, idempotency, unapproved capture rejection and cancellation. See [current verification](docs/block-5.md) and the [remaining shopper/submission checklist](docs/manual-test-handoff.md).

## Features and stack

Eight-product shop with search, filters and detail pages; editable persistent cart; AI gift finder with a budget per item; registration/sign-in and protected order history; operator-assisted password recovery; mixed-cart PayPal sandbox checkout; server-priced orders, capture verification, retry protection, cancellation and status reconciliation. There is no simulated AI or payment-success mode.

Next.js 16, React 19, TypeScript, Prisma 7, Supabase PostgreSQL and Vercel. OpenRouter requests `openrouter/free`; the actual selected free model can vary. The server restricts configuration to free models and does not fall back to paid models. The auth core is reused from the owner's TemuEvent Feature 2; small UI components are adapted from Spree's MIT storefront. See [source notices](THIRD_PARTY_NOTICES.md) and the companion notes for [auth](docs/block-1.md), [payments](docs/block-2.md), [storefront](docs/block-3.md), [AI](docs/block-4.md) and [release](docs/block-5.md).

## Run locally

Use Node.js 22.12 or newer.

```sh
npm ci
cp .env.example .env.local
```

Set `DATABASE_URL` to a dedicated PostgreSQL login restricted to the `erogine` schema. Set `AUTH_JWT_SECRET` to a fresh 64-character hexadecimal secret. Use the ignored local env file or server-only Vercel secrets.

For a new database, an administrator creates the `erogine_app` login with its own password and applies these files in order:

1. `database/001_foundation.sql`
2. `database/002_payment_processing.sql`
3. `database/003_password_recovery.sql`
4. `database/004_password_recovery_access.sql`

Do not grant the application role ownership, BYPASSRLS or access to other applications. Erogine does not use Supabase's browser Data API. Password recovery is operator-assisted; see [recovery instructions](docs/password-recovery.md).

```sh
npm run db:generate
npm run dev
```

Open http://localhost:3000/shop. Create an account with a passphrase of at least 15 characters. Set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` and `PAYPAL_ENVIRONMENT=sandbox` from your own Sandbox REST app. Set `OPENROUTER_API_KEY` and `OPENROUTER_MODEL=openrouter/free`. Restart after changing environment variables. No provider secret belongs in Git or a `NEXT_PUBLIC_` variable. Without keys the UI reports pending setup.

## Verify

```sh
npm test
npm run typecheck
npm run build
npm run db:check
```

The database check additionally tests isolation from TemuEvent when using the shared learning database. On a standalone database, omit that TemuEvent-specific check.

With the hosted preview configured, operators can run:

```sh
TEST_BASE_URL=https://your-preview.example node --import tsx scripts/verify-auth.ts
TEST_BASE_URL=https://your-preview.example node --import tsx scripts/verify-release.ts
```

These create disposable `example.test` accounts. Release verification creates an unapproved PayPal sandbox order, tests its lifecycle and cancels it; it never approves or captures a payment. Clean the recorded database fixtures afterward. Ignored `test-results/` reports identify the rows. The earlier `verify-payments.ts` script is specifically for the pre-credentials checkpoint; do not use it against configured providers.

Vercel uses `npm ci` and `npm run build`. The shared demo uses Preview configuration; redeploy the complete current source after environment changes. Git automatic deployment is not connected.

## Limits

Sandbox only. No fulfillment, refunds, verified webhooks or live-money mode. Free-provider capacity and schema compatibility can vary; early upstream HTTP 400 responses were followed by successful calls without an established root cause. Rate guards are per instance rather than a distributed quota. Existing illustrations are used for this small demo; photo replacement and broader AI experimentation are deferred.

MIT licensed; retain source notices.
