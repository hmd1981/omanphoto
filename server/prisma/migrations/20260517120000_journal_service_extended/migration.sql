-- AlterTable
ALTER TABLE "Service" ADD COLUMN "extendedBodyEn" TEXT,
ADD COLUMN "extendedBodyAr" TEXT,
ADD COLUMN "faqEn" TEXT,
ADD COLUMN "faqAr" TEXT;

-- CreateTable
CREATE TABLE "JournalPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "excerptEn" TEXT,
    "excerptAr" TEXT,
    "bodyEn" TEXT NOT NULL,
    "bodyAr" TEXT NOT NULL,
    "coverMediaId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalPost_slug_key" ON "JournalPost"("slug");

-- CreateIndex
CREATE INDEX "JournalPost_published_publishedAt_idx" ON "JournalPost"("published", "publishedAt" DESC);

-- AddForeignKey
ALTER TABLE "JournalPost" ADD CONSTRAINT "JournalPost_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
