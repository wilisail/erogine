# Block 1 — foundation

The F2 import is deliberately limited to password hashing, access tokens, persisted sessions and refresh/revocation logic. Registration immediately signs the customer in. Other TemuEvent features are excluded.

The separate `erogine` schema contains users, auth_sessions, auth_refresh_tokens, orders and order_items. A new runtime role has only server-side access to these tables. RLS is enabled. Queries derive ownership from the verified session. The Prisma schema contains no TemuEvent models.

Passwords use the original bounded scrypt implementation. Access tokens last 15 minutes; sessions have an absolute seven-day limit. Refresh secrets rotate and are stored as hashes. Replay revokes the session. Cookies are HttpOnly, SameSite=Lax, and Secure with a __Host- prefix in hosted production mode. Mutations enforce origin/application headers; sign-out also checks CSRF. The auth attempt limiter is per instance, not distributed.

| Endpoint | Purpose |
| --- | --- |
| POST /api/auth/register | Register and sign in |
| POST /api/auth/login | Sign in |
| GET /api/auth/session | Read session |
| GET /api/auth/csrf | Get sign-out token |
| POST /api/auth/refresh | Rotate refresh credentials |
| POST /api/auth/logout | Revoke and clear session |
| GET /api/health | Check hosted database |

The order model uses integer cents and unique checkout, PayPal order and capture identifiers. Block 2 will add server-priced creation, buyer approval, verified capture, cancellation/retry handling and receipts. Provider-specific calls stay separate from order ownership and storage so a later Stripe exercise can reuse those boundaries.
