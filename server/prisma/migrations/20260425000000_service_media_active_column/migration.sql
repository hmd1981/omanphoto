-- Repair DBs where ServiceMedia exists without `active` (e.g. partial push). Full fresh installs already have this column from 20260424210000_service_media.
ALTER TABLE "ServiceMedia" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
