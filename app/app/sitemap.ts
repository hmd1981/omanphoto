import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

/** Sitemap reads live slugs from the database — do not prerender at build without DATABASE_URL. */
export const dynamic = "force-dynamic";

const baseUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://omanphoto.com").replace(/\/$/, "");

const staticPaths = [
  "",
  "/portfolio",
  "/services",
  "/about",
  "/contact",
  "/book",
  "/ai-studio",
  "/journal",
  "/privacy",
  "/terms",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const now = new Date();

  const [services, journalPosts] = await Promise.all([
    prisma.service.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    prisma.journalPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of ["en", "ar"] as const) {
    for (const path of staticPaths) {
      entries.push({
        url: `${base}/${locale}${path}`,
        lastModified: now,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "/journal" ? 0.9 : 0.8,
      });
    }
    for (const s of services) {
      entries.push({
        url: `${base}/${locale}/services/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: "monthly",
        priority: 0.75,
      });
    }
    for (const p of journalPosts) {
      entries.push({
        url: `${base}/${locale}/journal/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "monthly",
        priority: 0.85,
      });
    }
  }

  return entries;
}
