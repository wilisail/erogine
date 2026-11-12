# Reused sources

TemuEvent Feature 2, owned by this project's owner and reused with their authorization:
https://github.com/wilisail/event-management-platform-pwdk/tree/a74a77c74b2c50cecd8b7fb20e70ea0d75698557/feature-2

- Retained `passwords.ts` and `sessions.ts`; changed namespaces in `session-tokens.ts`.
- Adapted the transactional session repository to Erogine's isolated schema and small user model.
- Retained the password/session regression tests, adapting paths and the profile-change assertion.
- Reused Supabase's public database CA certificate from the existing database setup.

These owner-authored modules are released here under the root MIT license. No event, organizer, referral, rewards, storage or email modules were imported.

Runtime dependencies retain their own package licenses. The lockfile records the versions. Spree's MIT storefront is a later-block candidate; no Spree code has been imported in Block 1.
