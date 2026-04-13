import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

const patchSchema = z.object({
  titleEn: z.string().min(1).optional(),
  titleAr: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  descriptionEn: z.string().min(1).optional(),
  descriptionAr: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Params) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const { id } = await ctx.params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const d = parsed.data;
  const update: Prisma.ServiceUpdateInput = {};
  if (d.slug !== undefined) update.slug = d.slug;
  if (d.sortOrder !== undefined) update.sortOrder = d.sortOrder;
  if (d.published !== undefined) update.published = d.published;

  if (d.title !== undefined || d.titleEn !== undefined || d.titleAr !== undefined) {
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const t = d.title?.trim();
    const titleEn = (d.titleEn ?? t ?? existing.titleEn).trim();
    const titleAr = (d.titleAr ?? t ?? existing.titleAr).trim();
    if (!titleEn) return NextResponse.json({ error: "Title required" }, { status: 400 });
    update.titleEn = titleEn;
    update.titleAr = titleAr || titleEn;
  }

  if (d.description !== undefined || d.descriptionEn !== undefined || d.descriptionAr !== undefined) {
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const desc = d.description?.trim();
    const descriptionEn = (d.descriptionEn ?? desc ?? existing.descriptionEn).trim();
    const descriptionAr = (d.descriptionAr ?? desc ?? existing.descriptionAr).trim();
    if (!descriptionEn) return NextResponse.json({ error: "Description required" }, { status: 400 });
    update.descriptionEn = descriptionEn;
    update.descriptionAr = descriptionAr || descriptionEn;
  }

  const item = await prisma.service.update({ where: { id }, data: update });
  revalidatePublicPages();
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, ctx: Params) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const { id } = await ctx.params;
  await prisma.service.delete({ where: { id } });
  revalidatePublicPages();
  return NextResponse.json({ ok: true });
}
