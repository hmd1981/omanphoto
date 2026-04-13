import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

const createSchema = z.object({
  titleEn: z.string().min(1).optional(),
  titleAr: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  descriptionEn: z.string().min(1).optional(),
  descriptionAr: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
});

export async function GET() {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const items = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const d = parsed.data;
  const t = d.title?.trim();
  const titleEn = (d.titleEn ?? t ?? "").trim();
  const titleAr = (d.titleAr ?? t ?? titleEn).trim();
  const desc = d.description?.trim();
  const descriptionEn = (d.descriptionEn ?? desc ?? "").trim();
  const descriptionAr = (d.descriptionAr ?? desc ?? descriptionEn).trim();
  if (!titleEn || !descriptionEn) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
  }
  const item = await prisma.service.create({
    data: {
      titleEn,
      titleAr: titleAr || titleEn,
      slug: d.slug,
      descriptionEn,
      descriptionAr: descriptionAr || descriptionEn,
      sortOrder: d.sortOrder ?? 0,
      published: d.published ?? true,
    },
  });
  revalidatePublicPages();
  return NextResponse.json({ item });
}
