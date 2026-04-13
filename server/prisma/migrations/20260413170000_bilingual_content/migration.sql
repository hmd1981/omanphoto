-- Category: bilingual names and descriptions
ALTER TABLE "Category" ADD COLUMN "nameEn" TEXT;
ALTER TABLE "Category" ADD COLUMN "nameAr" TEXT;
ALTER TABLE "Category" ADD COLUMN "descriptionEn" TEXT;
ALTER TABLE "Category" ADD COLUMN "descriptionAr" TEXT;
UPDATE "Category" SET "nameEn" = "name", "nameAr" = "name", "descriptionEn" = "description", "descriptionAr" = "description";
ALTER TABLE "Category" ALTER COLUMN "nameEn" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "nameAr" SET NOT NULL;
ALTER TABLE "Category" DROP COLUMN "name";
ALTER TABLE "Category" DROP COLUMN "description";

-- Media: bilingual titles
ALTER TABLE "Media" ADD COLUMN "titleEn" TEXT;
ALTER TABLE "Media" ADD COLUMN "titleAr" TEXT;
UPDATE "Media" SET "titleEn" = "title", "titleAr" = "title";
ALTER TABLE "Media" ALTER COLUMN "titleEn" SET NOT NULL;
ALTER TABLE "Media" ALTER COLUMN "titleAr" SET NOT NULL;
ALTER TABLE "Media" DROP COLUMN "title";

-- HeroSettings
ALTER TABLE "HeroSettings" ADD COLUMN "eyebrowEn" TEXT;
ALTER TABLE "HeroSettings" ADD COLUMN "eyebrowAr" TEXT;
ALTER TABLE "HeroSettings" ADD COLUMN "overlayTitleEn" TEXT;
ALTER TABLE "HeroSettings" ADD COLUMN "overlayTitleAr" TEXT;
ALTER TABLE "HeroSettings" ADD COLUMN "overlaySubtitleEn" TEXT;
ALTER TABLE "HeroSettings" ADD COLUMN "overlaySubtitleAr" TEXT;
ALTER TABLE "HeroSettings" ADD COLUMN "ctaLabelEn" TEXT;
ALTER TABLE "HeroSettings" ADD COLUMN "ctaLabelAr" TEXT;
UPDATE "HeroSettings" SET
  "eyebrowEn" = "eyebrow",
  "eyebrowAr" = "eyebrow",
  "overlayTitleEn" = "overlayTitle",
  "overlayTitleAr" = "overlayTitle",
  "overlaySubtitleEn" = "overlaySubtitle",
  "overlaySubtitleAr" = "overlaySubtitle",
  "ctaLabelEn" = "ctaLabel",
  "ctaLabelAr" = "ctaLabel";
ALTER TABLE "HeroSettings" DROP COLUMN "eyebrow";
ALTER TABLE "HeroSettings" DROP COLUMN "overlayTitle";
ALTER TABLE "HeroSettings" DROP COLUMN "overlaySubtitle";
ALTER TABLE "HeroSettings" DROP COLUMN "ctaLabel";

-- Service
ALTER TABLE "Service" ADD COLUMN "titleEn" TEXT;
ALTER TABLE "Service" ADD COLUMN "titleAr" TEXT;
ALTER TABLE "Service" ADD COLUMN "descriptionEn" TEXT;
ALTER TABLE "Service" ADD COLUMN "descriptionAr" TEXT;
UPDATE "Service" SET "titleEn" = "title", "titleAr" = "title", "descriptionEn" = "description", "descriptionAr" = "description";
ALTER TABLE "Service" ALTER COLUMN "titleEn" SET NOT NULL;
ALTER TABLE "Service" ALTER COLUMN "titleAr" SET NOT NULL;
ALTER TABLE "Service" ALTER COLUMN "descriptionEn" SET NOT NULL;
ALTER TABLE "Service" ALTER COLUMN "descriptionAr" SET NOT NULL;
ALTER TABLE "Service" DROP COLUMN "title";
ALTER TABLE "Service" DROP COLUMN "description";

-- PageContent
ALTER TABLE "PageContent" ADD COLUMN "titleEn" TEXT;
ALTER TABLE "PageContent" ADD COLUMN "titleAr" TEXT;
ALTER TABLE "PageContent" ADD COLUMN "bodyEn" TEXT;
ALTER TABLE "PageContent" ADD COLUMN "bodyAr" TEXT;
UPDATE "PageContent" SET "titleEn" = "title", "titleAr" = "title", "bodyEn" = "body", "bodyAr" = "body";
ALTER TABLE "PageContent" DROP COLUMN "title";
ALTER TABLE "PageContent" DROP COLUMN "body";

-- SiteSettings
ALTER TABLE "SiteSettings" ADD COLUMN "footerTaglineEn" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "footerTaglineAr" TEXT;
UPDATE "SiteSettings" SET "footerTaglineEn" = "footerTagline", "footerTaglineAr" = "footerTagline";
ALTER TABLE "SiteSettings" DROP COLUMN "footerTagline";

ALTER TABLE "SiteSettings" ADD COLUMN "footerBookLabelEn" TEXT NOT NULL DEFAULT 'Book a session';
ALTER TABLE "SiteSettings" ADD COLUMN "footerBookLabelAr" TEXT NOT NULL DEFAULT 'احجز جلسة';
UPDATE "SiteSettings" SET "footerBookLabelEn" = "footerBookLabel", "footerBookLabelAr" = "footerBookLabel";
ALTER TABLE "SiteSettings" DROP COLUMN "footerBookLabel";

ALTER TABLE "SiteSettings" ADD COLUMN "heroEyebrowEn" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "heroEyebrowAr" TEXT;
UPDATE "SiteSettings" SET "heroEyebrowEn" = "heroEyebrow", "heroEyebrowAr" = "heroEyebrow";
ALTER TABLE "SiteSettings" DROP COLUMN "heroEyebrow";

ALTER TABLE "SiteSettings" ADD COLUMN "navHomeEn" TEXT NOT NULL DEFAULT 'Home';
ALTER TABLE "SiteSettings" ADD COLUMN "navHomeAr" TEXT NOT NULL DEFAULT 'الرئيسية';
UPDATE "SiteSettings" SET "navHomeEn" = "navHome", "navHomeAr" = "navHome";
ALTER TABLE "SiteSettings" DROP COLUMN "navHome";

ALTER TABLE "SiteSettings" ADD COLUMN "navPortfolioEn" TEXT NOT NULL DEFAULT 'Portfolio';
ALTER TABLE "SiteSettings" ADD COLUMN "navPortfolioAr" TEXT NOT NULL DEFAULT 'الأعمال';
UPDATE "SiteSettings" SET "navPortfolioEn" = "navPortfolio", "navPortfolioAr" = "navPortfolio";
ALTER TABLE "SiteSettings" DROP COLUMN "navPortfolio";

ALTER TABLE "SiteSettings" ADD COLUMN "navServicesEn" TEXT NOT NULL DEFAULT 'Services';
ALTER TABLE "SiteSettings" ADD COLUMN "navServicesAr" TEXT NOT NULL DEFAULT 'الخدمات';
UPDATE "SiteSettings" SET "navServicesEn" = "navServices", "navServicesAr" = "navServices";
ALTER TABLE "SiteSettings" DROP COLUMN "navServices";

ALTER TABLE "SiteSettings" ADD COLUMN "navAboutEn" TEXT NOT NULL DEFAULT 'About';
ALTER TABLE "SiteSettings" ADD COLUMN "navAboutAr" TEXT NOT NULL DEFAULT 'من نحن';
UPDATE "SiteSettings" SET "navAboutEn" = "navAbout", "navAboutAr" = "navAbout";
ALTER TABLE "SiteSettings" DROP COLUMN "navAbout";

ALTER TABLE "SiteSettings" ADD COLUMN "navContactEn" TEXT NOT NULL DEFAULT 'Contact';
ALTER TABLE "SiteSettings" ADD COLUMN "navContactAr" TEXT NOT NULL DEFAULT 'تواصل';
UPDATE "SiteSettings" SET "navContactEn" = "navContact", "navContactAr" = "navContact";
ALTER TABLE "SiteSettings" DROP COLUMN "navContact";

ALTER TABLE "SiteSettings" ADD COLUMN "navMenuLabelEn" TEXT NOT NULL DEFAULT 'Menu';
ALTER TABLE "SiteSettings" ADD COLUMN "navMenuLabelAr" TEXT NOT NULL DEFAULT 'القائمة';
UPDATE "SiteSettings" SET "navMenuLabelEn" = "navMenuLabel", "navMenuLabelAr" = "navMenuLabel";
ALTER TABLE "SiteSettings" DROP COLUMN "navMenuLabel";

ALTER TABLE "SiteSettings" ADD COLUMN "defaultMetaTitleEn" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "defaultMetaTitleAr" TEXT;
UPDATE "SiteSettings" SET "defaultMetaTitleEn" = "defaultMetaTitle", "defaultMetaTitleAr" = "defaultMetaTitle";
ALTER TABLE "SiteSettings" DROP COLUMN "defaultMetaTitle";

ALTER TABLE "SiteSettings" ADD COLUMN "defaultMetaDescriptionEn" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "defaultMetaDescriptionAr" TEXT;
UPDATE "SiteSettings" SET "defaultMetaDescriptionEn" = "defaultMetaDescription", "defaultMetaDescriptionAr" = "defaultMetaDescription";
ALTER TABLE "SiteSettings" DROP COLUMN "defaultMetaDescription";

-- Contact inquiries: optional locale tag
ALTER TABLE "ContactInquiry" ADD COLUMN "locale" TEXT;
