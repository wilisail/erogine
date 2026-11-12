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

Completed against Preview https://erogine-nfyrgqmx1-andor2.vercel.app/shop from source commit `bf05f7a1aa1c3ac265463d5c0d2ebcefdd175a96` (Vercel target `staging` / Preview).

- **77 hosted HTTP checks passed**: 26 authentication checks plus 51 catalogue/payment/AI-boundary checks. These exercised the actual hosted app and its private PostgreSQL tables. Absent provider credentials failed closed; no real AI inference or PayPal transaction was performed.
- Browser interaction verified all eight products; search, combined filters, empty results/reset; product details; quantity selection; the USD 48 mixed cart; refresh persistence; USD 66 quantity recalculation; removal to USD 36 and then empty; and checkout routing to `/login?next=/checkout` with the cart retained.
- Browser sign-in completion stays in the user's deferred session. No credentials were entered in browser QA. Mobile viewport behavior has not been browser-tested.
- No application console error was observed. The browser extension emitted unrelated metadata errors.
- Three generated example.test accounts and two unpaid fixtures were removed. Follow-up database counts confirmed zero remaining QA users/orders, auth sessions or refresh tokens, and no extra orders.
- Browser cart fixtures were cleared. A storefront screenshot is saved in `screenshots/storefront.jpg`; it contains no account or payment information.
- Machine-readable evidence: [verification/block-5.json](verification/block-5.json).

Only notes and test evidence were added after this deployment; the running application source matches the recorded commit. Use the latest Preview URL returned after adding credentials and redeploying.
