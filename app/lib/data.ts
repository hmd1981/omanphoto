import type { PageHeroPlacement, Prisma } from "@/lib/generated/prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "./prisma";

export async function getPageHeroMedia(placement: PageHeroPlacement) {
  noStore();
  return prisma.pageHeroMedia.findUnique({
    where: { placement },
    include: { imageMedia: true, videoMedia: true },
  });
}

export async function getAllPageHeroMedia() {
  noStore();
  const rows = await prisma.pageHeroMedia.findMany({
    include: { imageMedia: true, videoMedia: true },
    orderBy: [{ sortOrder: "asc" }, { placement: "asc" }],
  });
  return rows;
}

export async function getSiteSettings() {
  noStore();
  return prisma.siteSettings.findUnique({ where: { id: "singleton" } });
}

export async function getHero() {
  noStore();
  return prisma.heroSettings.findUnique({
    where: { id: "singleton" },
    include: {
      imageMedia: { include: { category: true } },
      videoMedia: { include: { category: true } },
    },
  });
}

export async function getPublishedCategories() {
  noStore();
  return prisma.category.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPublishedServices() {
  noStore();
  return prisma.service.findMany({
    where: { published: true },
    orderBy: { sortOrder: "asc" },
    include: {
      serviceMedia: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: { media: true },
      },
    },
  });
}

/** Single published service with gallery rows (ordered ServiceMedia + Media). */
export async function getPublishedServiceBySlug(slug: string) {
  noStore();
  return prisma.service.findFirst({
    where: { slug, published: true },
    include: {
      serviceMedia: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        include: { media: true },
      },
    },
  });
}

export async function getPageSections(pageKey: string) {
  noStore();
  return prisma.pageContent.findMany({
    where: { pageKey, published: true },
    orderBy: { sortOrder: "asc" },
  });
}

/** Single section or null */
export async function getPageSection(pageKey: string, sectionKey: string) {
  noStore();
  return prisma.pageContent.findFirst({
    where: { pageKey, sectionKey, published: true },
  });
}

export async function getPageSectionMap(pageKey: string) {
  noStore();
  const rows = await getPageSections(pageKey);
  return Object.fromEntries(rows.map((r) => [r.sectionKey, r]));
}

export async function getSeoEntry(sectionKey: string) {
  noStore();
  return prisma.pageContent.findFirst({
    where: { pageKey: "seo", sectionKey, published: true },
  });
}

export async function getPortfolioMedia(categorySlug?: string | null) {
  noStore();
  const where: Prisma.MediaWhereInput = {
    active: true,
    category: { published: true },
  };
  if (categorySlug && categorySlug !== "all") {
    where.category = { slug: categorySlug, published: true };
  }
  return prisma.media.findMany({
    where,
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function getFeaturedMediaForHome(limit = 6) {
  noStore();
  return prisma.media.findMany({
    where: {
      active: true,
      featured: true,
      category: { published: true },
    },
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
}

export async function getPublishedJournalPosts() {
  noStore();
  return prisma.journalPost.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    include: { coverMedia: true },
  });
}

export async function getPublishedJournalPostBySlug(slug: string) {
  noStore();
  return prisma.journalPost.findFirst({
    where: { slug, published: true },
    include: { coverMedia: true },
  });
}

export async function getCategoryCoverMap() {
  noStore();
  const categories = await getPublishedCategories();
  const covers = await Promise.all(
    categories.map(async (c) => {
      const first = await prisma.media.findFirst({
        where: { categoryId: c.id, active: true, type: "IMAGE" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      return { categoryId: c.id, media: first };
    }),
  );
  return Object.fromEntries(covers.map((x) => [x.categoryId, x.media]));
}
