# Backend security controls

The API uses Prisma for database access and schema migrations. Passwords use bcrypt (cost 12), verification/reset codes are stored as HMAC digests, and session JWTs are checked with HS256 plus a database-backed session version. The `protect` and `allowRoles` middleware re-check the account, email verification, blocked status, and role on protected routes. Zod validates request bodies; admin query filters and route IDs are also checked.

Helmet, explicit CORS origins, a 20 KB JSON body limit, browser-origin checks for cookie mutations, endpoint rate limits, and generic API error responses protect the HTTP surface. The login, registration, verification, reset, Google sign-in, emergency, chat, and admin routes have limits. Mobile Bearer-token requests can omit `Origin`; browser cookie mutations cannot use an untrusted origin.

## Contact-data encryption

User and responder-application addresses/phone numbers, emergency callback phone numbers/descriptions/landmarks, and chat message bodies use AES-256-GCM field encryption when `FIELD_ENCRYPTION_KEY` is configured. Production startup requires this key. Existing plaintext records remain readable during migration, but are **not protected at rest** until backfilled.

1. Back up the database securely, then apply the column-widening migration with `npm run db:migrate`.
2. Generate a key once: `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`.
3. Put that value in `Backend/.env` as `FIELD_ENCRYPTION_KEY`. Keep a separate backup of the key outside the repository; losing it makes encrypted contact fields unreadable. Never rotate it by simply replacing the value.
4. Stop writes briefly and run `npm run db:encrypt-fields` in `Backend` to encrypt existing rows. The command is safe to rerun with the **same** key.
5. Restart the backend with the key configured in its hosting environment.

Emergency GPS coordinates remain numeric for dispatch/map use and are **not field-encrypted** by this change. Protect the PostgreSQL storage/backups with disk/database encryption, TLS, restricted database roles, and access logging. Email addresses remain plaintext because they are used for login and indexed lookup. Do not treat field encryption as a replacement for those controls.

## Repeatable security checks

- `npm run test:security` tests encryption integrity, origin checks, validation, and safe error responses without a database.
- `npm run test:encrypted-flows` checks encrypted emergency/chat storage and readable API responses using temporary database records.
- Import `security/security-checks.postman_collection.json` into Postman for non-destructive authorization and malformed-input checks.
- With Docker and a **disposable** local/staging backend on port 3000, run `./security/run-zap.ps1`. The API scan definition is `security/openapi.yaml`; it intentionally covers anonymous GET routes only, not account or incident creation. A fully authenticated scan needs a staging account/context and must not run against live emergency traffic.

The current rate-limit store is in memory. It protects a single backend instance; before scaling to multiple instances, move to a shared store (for example Redis) and configure proxy/IP handling for the chosen hosting platform. Also keep `JWT_SECRET`, SMTP credentials, and the encryption key in deployment secrets, not source control.
