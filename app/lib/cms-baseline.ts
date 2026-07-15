import fs from "node:fs";
import path from "node:path";
import type {
  Category,
  HeroSettings,
  JournalPost,
  Media,
  PageContent,
  PageHeroMedia,
  Service,
  ServiceMedia,
  SiteSettings,
} from "@/lib/generated/prisma/client";
import { PrismaClient } from "@/lib/generated/prisma/client";

export const CMS_BASELINE_VERSION = 1;
export const CMS_BASELINE_REL = "prisma/cms-baseline.json";

export function cmsBaselinePath(): string {
  return path.join(__dirname, "..", CMS_BASELINE_REL);
}

export function cmsBaselineExists(): boolean {
  return fs.existsSync(cmsBaselinePath());
}

export type CmsBaseline = {
  version: typeof CMS_BASELINE_VERSION;
  capturedAt: string;
  siteSettings: SiteSettings | null;
  heroSettings: HeroSettings | null;
  categories: Category[];
  media: Media[];
  pageContent: PageContent[];
  pageHeroMedia: PageHeroMedia[];
  services: Service[];
  serviceMedia: ServiceMedia[];
  journalPosts: JournalPost[];
};

export async function exportCmsBaseline(prisma: PrismaClient): Promise<CmsBaseline> {
  const [
    siteSettings,
    heroSettings,
    categories,
    media,
    pageContent,
    pageHeroMedia,
    services,
    serviceMedia,
    journalPosts,
  ] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }),
    prisma.heroSettings.findUnique({ where: { id: "singleton" } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.media.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.pageContent.findMany({ orderBy: [{ pageKey: "asc" }, { sortOrder: "asc" }] }),
    prisma.pageHeroMedia.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.serviceMedia.findMany({ orderBy: [{ serviceId: "asc" }, { sortOrder: "asc" }] }),
    prisma.journalPost.findMany({ orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }] }),
  ]);

  return {
    version: CMS_BASELINE_VERSION,
    capturedAt: new Date().toISOString(),
    siteSettings,
    heroSettings,
    categories,
    media,
    pageContent,
    pageHeroMedia,
    services,
    serviceMedia,
    journalPosts,
  };
}

export function writeCmsBaseline(baseline: CmsBaseline): string {
  const file = cmsBaselinePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
  return file;
}

export function readCmsBaseline(): CmsBaseline {
  const raw = fs.readFileSync(cmsBaselinePath(), "utf8");
  const data = JSON.parse(raw) as CmsBaseline;
  if (data.version !== CMS_BASELINE_VERSION) {
    throw new Error(`Unsupported cms-baseline version: ${data.version}`);
  }
  return data;
}

/** Restore CMS tables from baseline (does not touch users or upload files). */
export async function importCmsBaseline(prisma: PrismaClient, baseline: CmsBaseline): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const row of baseline.categories) {
      await tx.category.upsert({
        where: { id: row.id },
        update: {
          nameEn: row.nameEn,
          nameAr: row.nameAr,
          slug: row.slug,
          descriptionEn: row.descriptionEn,
          descriptionAr: row.descriptionAr,
          sortOrder: row.sortOrder,
          published: row.published,
        },
        create: row,
      });
    }

    for (const row of baseline.media) {
      await tx.media.upsert({
        where: { id: row.id },
        update: {
          titleEn: row.titleEn,
          titleAr: row.titleAr,
          type: row.type,
          filePath: row.filePath,
          url: row.url,
          categoryId: row.categoryId,
          sortOrder: row.sortOrder,
          active: row.active,
          featured: row.featured,
        },
        create: row,
      });
    }

    for (const row of baseline.services) {
      await tx.service.upsert({
        where: { id: row.id },
        update: {
          titleEn: row.titleEn,
          titleAr: row.titleAr,
          slug: row.slug,
          descriptionEn: row.descriptionEn,
          descriptionAr: row.descriptionAr,
          extendedBodyEn: row.extendedBodyEn,
          extendedBodyAr: row.extendedBodyAr,
          faqEn: row.faqEn,
          faqAr: row.faqAr,
          sortOrder: row.sortOrder,
          published: row.published,
        },
        create: row,
      });
    }

    for (const row of baseline.serviceMedia) {
      await tx.serviceMedia.upsert({
        where: { id: row.id },
        update: {
          serviceId: row.serviceId,
          mediaId: row.mediaId,
          sortOrder: row.sortOrder,
          active: row.active,
        },
        create: row,
      });
    }

    for (const row of baseline.pageContent) {
      await tx.pageContent.upsert({
        where: { pageKey_sectionKey: { pageKey: row.pageKey, sectionKey: row.sectionKey } },
        update: {
          titleEn: row.titleEn,
          titleAr: row.titleAr,
          bodyEn: row.bodyEn,
          bodyAr: row.bodyAr,
          published: row.published,
          sortOrder: row.sortOrder,
        },
        create: row,
      });
    }

    for (const row of baseline.pageHeroMedia) {
      await tx.pageHeroMedia.upsert({
        where: { placement: row.placement },
        update: {
          active: row.active,
          sortOrder: row.sortOrder,
          mediaType: row.mediaType,
          imageMediaId: row.imageMediaId,
          videoMediaId: row.videoMediaId,
          videoUrl: row.videoUrl,
        },
        create: row,
      });
    }

    if (baseline.siteSettings) {
      const s = baseline.siteSettings;
      await tx.siteSettings.upsert({
        where: { id: "singleton" },
        update: { ...s, id: "singleton" },
        create: s,
      });
    }

    if (baseline.heroSettings) {
      const h = baseline.heroSettings;
      await tx.heroSettings.upsert({
        where: { id: "singleton" },
        update: {
          mediaType: h.mediaType,
          imageMediaId: h.imageMediaId,
          videoMediaId: h.videoMediaId,
          videoUrl: h.videoUrl,
          eyebrowEn: h.eyebrowEn,
          eyebrowAr: h.eyebrowAr,
          overlayTitleEn: h.overlayTitleEn,
          overlayTitleAr: h.overlayTitleAr,
          overlaySubtitleEn: h.overlaySubtitleEn,
          overlaySubtitleAr: h.overlaySubtitleAr,
          ctaLabelEn: h.ctaLabelEn,
          ctaLabelAr: h.ctaLabelAr,
          ctaHref: h.ctaHref,
        },
        create: h,
      });
    }

    for (const row of baseline.journalPosts) {
      await tx.journalPost.upsert({
        where: { slug: row.slug },
        update: {
          titleEn: row.titleEn,
          titleAr: row.titleAr,
          excerptEn: row.excerptEn,
          excerptAr: row.excerptAr,
          bodyEn: row.bodyEn,
          bodyAr: row.bodyAr,
          coverMediaId: row.coverMediaId,
          published: row.published,
          publishedAt: new Date(row.publishedAt),
          sortOrder: row.sortOrder,
        },
        create: {
          ...row,
          publishedAt: new Date(row.publishedAt),
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        },
      });
    }
  });
}

export function shouldPreserveCms(): boolean {
  return process.env.OMANPHOTO_PRESERVE_CMS === "1" || cmsBaselineExists();
}
