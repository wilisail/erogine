# Reused sources

TemuEvent Feature 2, owned by this project's owner and reused with their authorization:
https://github.com/wilisail/event-management-platform-pwdk/tree/a74a77c74b2c50cecd8b7fb20e70ea0d75698557/feature-2

- Retained `passwords.ts` and `sessions.ts`; changed namespaces in `session-tokens.ts`.
- Adapted the transactional session repository to Erogine's isolated schema and small user model.
- Retained the password/session regression tests, adapting paths and the profile-change assertion.
- Reused Supabase's public database CA certificate from the existing database setup.

These owner-authored modules are released here under the root MIT license. No event, organizer, referral, rewards, storage or email modules were imported.

Block 2 adapts the lazy SDK loading and callback structure of Spree's MIT `PayPalPaymentForm.tsx`, removing its checkout framework, translations and extra funding methods:
https://github.com/spree/storefront/blob/63cf0dc0aec38d7c50adbc316da124d9908f27ca/src/components/checkout/PayPalPaymentForm.tsx

Copyright (c) 2026 Vendo Connect Inc., Vendo Sp. z o.o. The full notice is retained in [licenses/spree-MIT.txt](licenses/spree-MIT.txt). Erogine's server pricing, ownership, order storage and capture verification are new code; the rest of Spree's commerce system was not imported.

Runtime dependencies retain their own package licenses. The lockfile records the versions. The official `@paypal/react-paypal-js` SDK is Apache-2.0 licensed; it is consumed as a dependency rather than relicensed under MIT. Its root exports use the supported JavaScript SDK v5 integration; SDK v6 has separate exports and can be a later migration.
