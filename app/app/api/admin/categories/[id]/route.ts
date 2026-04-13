import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

const patchSchema = z.object({
  nameEn: z.string().min(1).optional(),
  nameAr: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  descriptionEn: z.string().nullable().optional(),
  descriptionAr: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
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
  const update: Prisma.CategoryUpdateInput = {};
  if (d.slug !== undefined) update.slug = d.slug;
  if (d.sortOrder !== undefined) update.sortOrder = d.sortOrder;
  if (d.published !== undefined) update.published = d.published;
  if (d.descriptionEn !== undefined) update.descriptionEn = d.descriptionEn;
  if (d.descriptionAr !== undefined) update.descriptionAr = d.descriptionAr;
  if (d.description !== undefined && d.descriptionEn === undefined) {
    update.descriptionEn = d.description;
    update.descriptionAr = d.description;
  }

  if (d.name !== undefined || d.nameEn !== undefined || d.nameAr !== undefined) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const n = d.name?.trim();
    const en = (d.nameEn ?? n ?? existing.nameEn).trim();
    const ar = (d.nameAr ?? n ?? existing.nameAr).trim();
    if (!en) return NextResponse.json({ error: "Name required" }, { status: 400 });
    update.nameEn = en;
    update.nameAr = ar || en;
  }

  const item = await prisma.category.update({ where: { id }, data: update });
  revalidatePublicPages();
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, ctx: Params) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const { id } = await ctx.params;
  await prisma.category.delete({ where: { id } });
  revalidatePublicPages();
  return NextResponse.json({ ok: true });
}
