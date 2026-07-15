import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/lib/generated/prisma/client";
import { MediaType } from "@/lib/generated/prisma/client";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  titleEn: z.string().min(1).optional(),
  titleAr: z.string().min(1).optional(),
  type: z.enum(MediaType).optional(),
  filePath: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
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

  const update: Prisma.MediaUpdateInput = {};
  if (d.type !== undefined) update.type = d.type;
  if (d.filePath !== undefined) update.filePath = d.filePath;
  if (d.url !== undefined) update.url = d.url;
  if (d.categoryId !== undefined) {
    update.category =
      d.categoryId === "" || d.categoryId === null ? { disconnect: true } : { connect: { id: d.categoryId } };
  }
  if (d.sortOrder !== undefined) update.sortOrder = d.sortOrder;
  if (d.active !== undefined) update.active = d.active;
  if (d.featured !== undefined) update.featured = d.featured;

  if (d.title !== undefined || d.titleEn !== undefined || d.titleAr !== undefined) {
    const existing = await prisma.media.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const t = d.title?.trim();
    const en = (d.titleEn ?? t ?? existing.titleEn).trim();
    const ar = (d.titleAr ?? t ?? existing.titleAr).trim();
    if (!en) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    update.titleEn = en;
    update.titleAr = ar || en;
  }

  const item = await prisma.media.update({
    where: { id },
    data: update,
    include: { category: true },
  });
  revalidatePublicPages();
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, ctx: Params) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const { id } = await ctx.params;
  await prisma.$transaction(async (tx) => {
    const hero = await tx.heroSettings.findUnique({ where: { id: "singleton" } });
    if (hero?.imageMediaId === id) {
      await tx.heroSettings.update({ where: { id: "singleton" }, data: { imageMediaId: null } });
    }
    if (hero?.videoMediaId === id) {
      await tx.heroSettings.update({ where: { id: "singleton" }, data: { videoMediaId: null } });
    }
    await tx.media.delete({ where: { id } });
  });
  revalidatePublicPages();
  return NextResponse.json({ ok: true });
}
