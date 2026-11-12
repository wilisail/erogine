# Block 5 — release verification

Current Preview: https://erogine-preview-andor2.vercel.app/shop

## 12 November 2026 release checkpoint

- **40 unit tests passed**: auth/session, server quotes and payment lifecycle, cart, AI response boundaries and typed-budget parsing.
- **26 hosted authentication checks passed** against the configured stable Preview.
- **63 configured-provider release checks passed** against the configured stable Preview: full catalogue, private receipts, CSRF/origin guards, trusted server prices, invalid cart rejection, duplicate checkout reuse, cart-change conflicts, unapproved capture rejection, real PayPal sandbox order creation/reconciliation/cancellation and AI input boundaries.
- The automated PayPal order was never approved or captured. It was saved as CANCELED with no capture identifier. The owner's separate USD 18 PAID order remains separate.
- TypeScript checks passed. The hosted build containing the budget fix is READY.
- Production dependency audit: zero known vulnerabilities at this checkpoint.
- Browser check on the new build accepted typed `$24.50`. The parser also accepts `24`, `24.50`, `USD 24.50` and decimal commas; invalid or out-of-range input gets a clear error instead of silently changing the amount.
- Browser cart check: add Moss Bear, confirm USD 22, reload and retain the item/quantity/total, then remove it and confirm empty. The browser test cart was cleared.

The 26 + 63 hosted checks ran before the budget-only client change, on application commit `9b6d903c811b039c370f6fff7e3e3c750ca04bcc`. Server code is unchanged in this release. The new build passed the four post-deploy HTTP checks and browser budget/cart checks described above. All three disposable QA accounts and the canceled QA order were removed; database counts returned zero and the owner's original order remained PAID.

Release-check application commit: `537629dfe9ef9fb6fff9449ffac38bf043280c42`.
Release deployment: `erogine-dak6ck49a-andor2.vercel.app` (Preview).
Machine-readable checkpoint: [verification/final-release.json](verification/final-release.json).

## External-provider evidence

The owner completed an actual PayPal sandbox approval/capture for USD 18. A private receipt displayed PAID, and the database held the completed capture. Real OpenRouter requests returned catalogue products with reasons. The owner's browser screenshot also showed `soft toy` recommendations within USD 24 per item. These observations are distinct from injected unit-test fixtures.

The first live OpenRouter checks received upstream HTTP 400 responses before the same configuration later worked. No exact root cause was established. Free-provider reliability and compatibility can vary.

## Remaining user checks and submission

1. In the final browser session, add an AI recommendation to the cart and confirm the amount.
2. Briefly cancel a new PayPal popup and confirm the order does not show PAID and the cart remains available. The cancellation API already passed automated checks; this verifies the popup callback.
3. Record the continuous AI → cart → sandbox approval/capture → PAID receipt flow; reload the receipt and show My account. This can be the submission video.
4. Make the repository public with MIT/source notices retained, upload a public YouTube video under three minutes and submit the demo, repository, video and description on Devpost.

Public repository publication, final video and final submission are still pending. The owner subsequently supplied eight matching product photos; their catalogue, recommendation, detail and cart display is covered in `verification/catalogue-images.json`. Broader AI experiments are deferred.

## Earlier checkpoint

Before credentials were configured, 38 unit tests and 77 hosted checks passed. The earlier evidence remains in [verification/block-5.json](verification/block-5.json). That checkpoint specifically tested missing-provider configuration and did not establish real provider success. `scripts/verify-payments.ts` belongs to that earlier mode; `scripts/verify-release.ts` checks configured sandbox providers.

## Catalogue photo update — 12 November 2026

The subsequent image build (`84dce36441672415fcffc65b0a6f732ae53a5ceb`) is READY at the same stable Preview link. All eight owner-supplied images are mapped to their SKUs, served locally as WebP assets and used by the shared catalogue/recommendation/detail/cart component. The catalogue and detail views retain the original landscape composition.

20 post-deploy HTTP checks passed, including all eight byte-matched assets, all eight product pages, the catalogue, configured service health and two resized image responses. Browser verification found all eight photos loaded, checked a product detail and matching cart thumbnail, then cleared the test cart. Source mapping and evidence: [verification/catalogue-images.json](verification/catalogue-images.json). Screenshot: [screenshots/catalogue-photos.jpg](screenshots/catalogue-photos.jpg). Server payment/auth/AI code was unchanged.
