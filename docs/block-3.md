# Block 3 — storefront and cart

Eight static demo products share one catalogue with the server's payment quote. Shop search and category buttons, detail pages, cart quantity changes/removal and mixed-product checkout are implemented. No product database, seller dashboard or separate commerce service is needed for this submission.

Spree's MIT product-card and quantity-picker components were adapted to the existing Erogine theme. Their source/version and license are recorded in `THIRD_PARTY_NOTICES.md`; the Spree SDK/backend, translation system and UI framework were excluded to keep dependencies small. Product illustrations are CSS shapes, so the demo needs no external image account or asset service.

The browser stores only product IDs and quantities in `erogine-cart-v1`. Invalid, duplicate, unknown and out-of-range entries are discarded. Injected prices are stripped. This improves the browser experience; the payment server still independently prices and validates the cart. Local storage survives sign-in, and the allowlisted `next` destination returns a shopper to checkout after login or registration.

An active checkout retains its key and item IDs in per-user session storage. Refreshing resumes the same local order instead of immediately creating another payment. The stored order is checked through the authenticated API before reuse. Its items stay fixed during approval. A completed capture clears a matching cart; cancellation preserves it. If an existing order cannot be checked, checkout pauses with a link to the account.

| Route | Purpose |
| --- | --- |
| `/shop` | Browse all eight products; filter and search |
| `/products/[id]` | Product details and quantity selection |
| `/cart` | Edit quantities, remove items and continue |
| `/checkout` | Authenticated cart-priced sandbox checkout |
| `/orders/[id]` | Private server-backed receipt |

Automated checks and the hosted/browser evidence are recorded in Block 5. PayPal account setup and the actual approval/capture test remain grouped with the other user steps in `docs/manual-test-handoff.md`.
