-- Classify respondent accounts so emergency requests can be routed by service.
CREATE TYPE "ResponderUnit" AS ENUM ('HEALTH_AMBULANCE', 'PNP_POLICE', 'BFP_FIRE', 'MDRRMO');

ALTER TABLE "users" ADD COLUMN "responder_unit" "ResponderUnit";

-- Existing respondents are assigned to the general municipal response unit.
-- Administrators can change this assignment later when account management is added.
UPDATE "users"
SET "responder_unit" = 'MDRRMO'
WHERE "role" = 'respondent';

CREATE INDEX "users_role_responder_unit_idx" ON "users"("role", "responder_unit");
