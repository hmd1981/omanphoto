/*
  Warnings:

  - You are about to drop the column `read` on the `ContactInquiry` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'READ', 'ARCHIVED');

-- AlterTable
ALTER TABLE "ContactInquiry" DROP COLUMN "read",
ADD COLUMN     "status" "InquiryStatus" NOT NULL DEFAULT 'NEW';

-- AlterTable
ALTER TABLE "HeroSettings" ADD COLUMN     "eyebrow" TEXT;

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "brandName" TEXT NOT NULL DEFAULT 'Oman Photo',
    "footerTagline" TEXT,
    "footerEmail" TEXT,
    "footerLocationLine" TEXT,
    "footerBookLabel" TEXT NOT NULL DEFAULT 'Book a session',
    "copyrightName" TEXT NOT NULL DEFAULT 'Oman Photo',
    "heroEyebrow" TEXT,
    "navHome" TEXT NOT NULL DEFAULT 'Home',
    "navPortfolio" TEXT NOT NULL DEFAULT 'Portfolio',
    "navServices" TEXT NOT NULL DEFAULT 'Services',
    "navAbout" TEXT NOT NULL DEFAULT 'About',
    "navContact" TEXT NOT NULL DEFAULT 'Contact',
    "navMenuLabel" TEXT NOT NULL DEFAULT 'Menu',
    "defaultMetaTitle" TEXT,
    "defaultMetaDescription" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
