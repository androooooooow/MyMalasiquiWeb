-- Existing installations may have legacy VARCHAR limits that cannot hold
-- authenticated-encryption envelopes. Widen only these contact fields.
ALTER TABLE "users"
  ALTER COLUMN "address" TYPE TEXT,
  ALTER COLUMN "phone_num" TYPE TEXT;
