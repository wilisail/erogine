# Block 4 — one catalogue-grounded AI gift finder

The shopper enters interests and a maximum USD budget **per item**. The server filters affordable catalogue candidates, makes one OpenRouter request, validates one to three unique product IDs, and joins those IDs back to the real catalogue. Recommendation cards use the same Add to cart action as the shop; checkout then independently prices those items through the PayPal flow.

No AI output can set a price, customer, order status or payment ID. The model has no payment tools or database access. Unknown, duplicate, over-budget or malformed recommendations are rejected. Model prose is displayed as ordinary React text. The request contains only the interests, budget and product catalogue; account details and payment credentials are excluded. Shoppers are asked to leave personal details out of their interests.

The integration uses OpenRouter's documented HTTP API directly, keeping the existing dependency set. Default model routing is `openrouter/free`; only that router or an explicit `:free` model is accepted. No paid fallback list is sent. Free-model availability and quotas can vary. Requests use a 25-second timeout, a 650-token output cap, a JSON schema and local validation. Per-instance user-rate and concurrency guards bound this learning deployment; they are not a distributed production quota.

Without `OPENROUTER_API_KEY`, the shop shows that AI setup is pending and the API returns `AI_NOT_CONFIGURED`. Ordinary catalogue browsing still works. A budget below every product returns an explicitly labelled empty catalogue result without pretending to have called AI.

Eight new tests cover catalogue grounding, budget boundaries, hallucinated IDs/prices, malformed/truncated output, request limits, safe provider failures, missing configuration and rejection of paid-model overrides. The provider responses in those tests are injected fixtures. A real OpenRouter inference remains pending the user's key setup; it must be demonstrated before calling the AI journey verified.

Setup: add `OPENROUTER_API_KEY` to Vercel **Preview**, keep `OPENROUTER_MODEL=openrouter/free`, and redeploy alongside the PayPal variables. Do not put keys into chat or Git. The combined manual sequence is in `docs/manual-test-handoff.md`.

Official references checked 12 November 2026:

- https://openrouter.ai/docs/api/reference/overview
- https://openrouter.ai/docs/guides/features/structured-outputs
- https://openrouter.ai/docs/guides/routing/model-variants/free
- https://openrouter.ai/openrouter/free
