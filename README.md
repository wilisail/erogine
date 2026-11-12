# Erogine

A small payment-learning project for the PayPal AI Hackathon. Intended journey: catalogue-grounded AI recommendation → cart → PayPal sandbox checkout → verified order.

## Block 1

Implemented: shared shop/account theme, registration with immediate sign-in, persisted sessions, refresh rotation, sign-out, protected account page and order-history empty state. Payments and AI are not simulated; they follow in later blocks.

Stack: Next.js 16, React 19, TypeScript, Prisma 7, Supabase PostgreSQL and Vercel. One application; no separate Express deployment. The auth core is reused from the owner's TemuEvent Feature 2. See [source notices](THIRD_PARTY_NOTICES.md) and [Block 1 notes](docs/block-1.md).

## Run

Use Node.js 22.12 or newer.

```sh
npm ci
cp .env.example .env.local
```

Set `DATABASE_URL` to a dedicated PostgreSQL login restricted to the `erogine` schema. Set `AUTH_JWT_SECRET` to a fresh 64-character hexadecimal secret. Use the ignored local env file or server-only Vercel secrets.

For a new database, an administrator creates the `erogine_app` login with its own password, then applies `database/001_foundation.sql`. Do not grant it ownership, BYPASSRLS or access to other applications. Erogine does not use Supabase's browser Data API.

```sh
npm run db:generate
npm run dev
```

Open http://localhost:3000. Create an account with a passphrase of at least 15 characters, inspect the account page and sign out.

## Verify

```sh
npm test
npm run typecheck
npm run build
npm run db:check
```

The database check additionally tests isolation from TemuEvent when using the shared learning database. On a standalone database, omit that TemuEvent-specific check.

Vercel uses `npm ci` and `npm run build`. Set `DATABASE_URL` and `AUTH_JWT_SECRET` as server-only secrets in the chosen environment. No provider secret belongs in Git or a `NEXT_PUBLIC_` variable. All payment work will use the PayPal sandbox.

MIT licensed; retain source notices.
