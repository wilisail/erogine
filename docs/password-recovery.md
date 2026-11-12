# Operator-assisted password recovery

This demo supports consuming an account-owner's one-time password-reset link.
It does not yet send automated recovery emails or expose a public token issuer.
An authenticated operator issues a link only after an owner requests recovery.

- Generate a random 32-byte, base64url token and store only its SHA-256 digest in
  the private `erogine.auth_password_resets` table for the requested user ID.
- Use a short expiry (one hour for this guided testing session).
- Deliver the HTTPS link privately as `/reset-password#token=...`. The fragment
  is read by the form and removed from the address bar; it is not a request URL.
- The user chooses and confirms a password of at least 15 characters. Viewing
  the link does not change the password. A valid submission atomically consumes
  the link, invalidates the user's other reset links and revokes all sessions.
- A normal sign-in is required afterward. Never put raw tokens, passwords or
  provider credentials in source control or test evidence.

Apply `database/003_password_recovery.sql`, then
`database/004_password_recovery_access.sql` before deploying this feature.
