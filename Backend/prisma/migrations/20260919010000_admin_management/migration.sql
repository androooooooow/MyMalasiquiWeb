ALTER TABLE "users" ADD COLUMN "blocked_at" TIMESTAMP(3), ADD COLUMN "block_reason" TEXT;

CREATE TYPE "AdminAuditAction" AS ENUM ('USER_BLOCKED', 'USER_UNBLOCKED');

CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "target_user_id" INTEGER NOT NULL,
    "action" "AdminAuditAction" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at");
CREATE INDEX "admin_audit_logs_target_user_id_created_at_idx" ON "admin_audit_logs"("target_user_id", "created_at");

ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
