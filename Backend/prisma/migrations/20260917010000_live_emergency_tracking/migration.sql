-- Keep one active request per citizen and store the assigned responder's live position.
ALTER TABLE "emergency_requests"
ADD COLUMN "active_citizen_id" INTEGER,
ADD COLUMN "responder_latitude" DOUBLE PRECISION,
ADD COLUMN "responder_longitude" DOUBLE PRECISION,
ADD COLUMN "responder_accuracy_meters" INTEGER,
ADD COLUMN "responder_location_updated_at" TIMESTAMP(3);

UPDATE "emergency_requests"
SET "active_citizen_id" = "citizen_id"
WHERE "status" IN ('PENDING', 'ACCEPTED', 'EN_ROUTE');

CREATE UNIQUE INDEX "emergency_requests_active_citizen_id_key"
ON "emergency_requests"("active_citizen_id");
