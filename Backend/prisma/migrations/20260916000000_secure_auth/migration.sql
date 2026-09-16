ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "email_verification_token" TEXT,
  ADD COLUMN IF NOT EXISTS "verification_expires_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "google_sub" TEXT,
  ADD COLUMN IF NOT EXISTS "auth_provider" TEXT NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_verification_token_key" ON "users"("email_verification_token");
CREATE UNIQUE INDEX IF NOT EXISTS "users_google_sub_key" ON "users"("google_sub");
