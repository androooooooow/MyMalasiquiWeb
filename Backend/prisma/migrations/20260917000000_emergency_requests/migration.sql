-- CreateEnum
CREATE TYPE "EmergencyService" AS ENUM ('AMBULANCE', 'FIRE', 'POLICE', 'SEARCH_RESCUE', 'DISASTER', 'OTHER');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EN_ROUTE', 'RESOLVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "emergency_requests" (
    "id" TEXT NOT NULL,
    "citizen_id" INTEGER NOT NULL,
    "assigned_responder_id" INTEGER,
    "service" "EmergencyService" NOT NULL,
    "status" "EmergencyStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "people_affected" TEXT NOT NULL,
    "landmark" TEXT,
    "callback_phone" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy_meters" INTEGER NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "emergency_requests_citizen_id_created_at_idx" ON "emergency_requests"("citizen_id", "created_at");

-- CreateIndex
CREATE INDEX "emergency_requests_assigned_responder_id_status_idx" ON "emergency_requests"("assigned_responder_id", "status");

-- CreateIndex
CREATE INDEX "emergency_requests_status_created_at_idx" ON "emergency_requests"("status", "created_at");

-- AddForeignKey
ALTER TABLE "emergency_requests" ADD CONSTRAINT "emergency_requests_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_requests" ADD CONSTRAINT "emergency_requests_assigned_responder_id_fkey" FOREIGN KEY ("assigned_responder_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
