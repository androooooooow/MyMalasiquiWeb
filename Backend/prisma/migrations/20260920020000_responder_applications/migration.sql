CREATE TYPE "ResponderApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "responder_applications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone_num" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "responder_unit" "ResponderUnit" NOT NULL,
    "password_hash" TEXT,
    "status" "ResponderApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "review_reason" TEXT,
    "reviewed_by_id" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "email_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "responder_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "responder_applications_email_key" ON "responder_applications"("email");
CREATE INDEX "responder_applications_status_created_at_idx" ON "responder_applications"("status", "created_at");
ALTER TABLE "responder_applications" ADD CONSTRAINT "responder_applications_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
