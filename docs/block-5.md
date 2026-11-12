# Block 5 — automated integration and release checks

Story: a shopper explores Erogine's real catalogue, gets AI gift suggestions, adds chosen items to the persistent cart, signs in, approves PayPal sandbox payment, and receives a private receipt after server verification.

## Evidence available before provider setup

- 38 unit tests passed: 14 auth, 14 payment, two cart and eight AI tests.
- TypeScript checks and the production build passed.
- `npm audit --omit=dev` reported zero known vulnerabilities in the production dependency tree at this checkpoint. This is a point-in-time audit, not a guarantee of absence of vulnerabilities.
- Git whitespace validation passed. React review covered stable component definitions, labelled controls, keyboard quantity editing, versioned browser storage, safe rendering of model text and lazy PayPal SDK loading.
- Hosted and browser checks are recorded below after deployment. Provider success responses in unit tests are controlled fixtures, not real external transactions.

## Pending user-dependent boundaries

| Boundary | Why it is pending |
| --- | --- |
| OpenRouter → real model → recommendation cards | User's OpenRouter key is not configured |
| PayPal popup → buyer approval → real sandbox capture | Sandbox REST credentials and buyer approval are not available |
| Public repository and submission video | User will complete release setup and recording together |

There is no mock-success API route in the deployed app. Absent keys result in setup notices and safe API errors. The full combined user checklist is `docs/manual-test-handoff.md`.

## Hosted/browser checkpoint

To be completed after the combined build is deployed.
