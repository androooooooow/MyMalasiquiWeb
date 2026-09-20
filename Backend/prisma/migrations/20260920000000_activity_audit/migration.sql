CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "actor_id" INTEGER,
    "actor_name" TEXT NOT NULL,
    "actor_email" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "subject_type" TEXT,
    "subject_id" TEXT,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");
CREATE INDEX "activity_logs_actor_role_created_at_idx" ON "activity_logs"("actor_role", "created_at");
CREATE INDEX "activity_logs_actor_id_created_at_idx" ON "activity_logs"("actor_id", "created_at");
CREATE INDEX "activity_logs_action_created_at_idx" ON "activity_logs"("action", "created_at");
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve administrator history already recorded before the activity log existed.
INSERT INTO "activity_logs" ("id", "actor_id", "actor_name", "actor_email", "actor_role", "action", "subject_type", "subject_id", "details", "created_at")
SELECT 'legacy-' || a."id", a."actor_id", u."name", u."email", u."role", a."action"::text,
       'user', a."target_user_id"::text, a."reason", a."created_at"
FROM "admin_audit_logs" a JOIN "users" u ON u."id" = a."actor_id";
