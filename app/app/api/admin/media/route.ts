import { NextResponse } from "next/server";
import { z } from "zod";
import { MediaType } from "@prisma/client";
import { requireAdminUser } from "@/lib/admin-api";
import { PAGE_HERO_USAGE_LABEL } from "@/lib/admin-media-usage-labels";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

const createSchema = z.object({
  title: z.string().min(1).optional(),
  titleEn: z.string().min(1).optional(),
  titleAr: z.string().min(1).optional(),
  type: z.nativeEnum(MediaType),
  filePath: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
});

function resolveTitles(input: z.infer<typeof createSchema>): { titleEn: string; titleAr: string } | null {
  const t = input.title?.trim();
  const en = (input.titleEn ?? t ?? "").trim();
  const ar = (input.titleAr ?? t ?? en).trim();
  if (!en) return null;
  return { titleEn: en, titleAr: ar || en };
}

export async function GET(request: Request) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const [hero, pageHeroRows] = await Promise.all([
    prisma.heroSettings.findUnique({ where: { id: "singleton" } }),
    prisma.pageHeroMedia.findMany(),
  ]);
  const items = await prisma.media.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  const enriched = items.map((m) => {
    const usageLabels: string[] = [];
    if (hero?.imageMediaId === m.id) usageLabels.push("Home hero — image background");
    if (hero?.videoMediaId === m.id) usageLabels.push("Home hero — video background");
    for (const ph of pageHeroRows) {
      if (ph.imageMediaId === m.id) usageLabels.push(`${PAGE_HERO_USAGE_LABEL[ph.placement]} · image`);
      if (ph.videoMediaId === m.id) usageLabels.push(`${PAGE_HERO_USAGE_LABEL[ph.placement]} · video`);
    }
    if (m.featured) usageLabels.push("Home page — featured strip");
    if (m.categoryId && m.category) {
      usageLabels.push(`Galleries — ${m.category.nameEn} (/${m.category.slug})`);
    } else {
      usageLabels.push("Galleries — unassigned category");
    }
    return { ...m, usageLabels };
  });
  return NextResponse.json({ items: enriched });
}

export async function POST(request: Request) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const titles = resolveTitles(parsed.data);
  if (!titles) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  const item = await prisma.media.create({
    data: {
      titleEn: titles.titleEn,
      titleAr: titles.titleAr,
      type: parsed.data.type,
      filePath: parsed.data.filePath ?? null,
      url: parsed.data.url ?? null,
      categoryId: parsed.data.categoryId === "" ? null : (parsed.data.categoryId ?? null),
      sortOrder: parsed.data.sortOrder ?? 0,
      active: parsed.data.active ?? true,
      featured: parsed.data.featured ?? false,
    },
    include: { category: true },
  });
  revalidatePublicPages();
  return NextResponse.json({ item });
}
