-- Join table: ordered media per service (cover = first active image in sort order).
-- Idempotent: table may already exist from an earlier db push or partial apply.
CREATE TABLE IF NOT EXISTS "ServiceMedia" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServiceMedia_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ServiceMedia" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "ServiceMedia_serviceId_mediaId_key" ON "ServiceMedia"("serviceId", "mediaId");
CREATE INDEX IF NOT EXISTS "ServiceMedia_serviceId_sortOrder_idx" ON "ServiceMedia"("serviceId", "sortOrder");

DO $$
BEGIN
  ALTER TABLE "ServiceMedia" ADD CONSTRAINT "ServiceMedia_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "ServiceMedia" ADD CONSTRAINT "ServiceMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
