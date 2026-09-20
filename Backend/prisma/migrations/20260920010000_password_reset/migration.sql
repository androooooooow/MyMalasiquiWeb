ALTER TABLE "users"
  ADD COLUMN "password_reset_token" TEXT,
  ADD COLUMN "password_reset_expires_at" TIMESTAMP(3),
  ADD COLUMN "password_reset_requested_at" TIMESTAMP(3),
  ADD COLUMN "password_reset_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "users_password_reset_token_key" ON "users"("password_reset_token");
