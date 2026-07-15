import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/lib/generated/prisma/client";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

const patchSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  titleEn: z.string().min(1).optional(),
  titleAr: z.string().min(1).optional(),
  excerptEn: z.string().nullable().optional(),
  excerptAr: z.string().nullable().optional(),
  bodyEn: z.string().min(1).optional(),
  bodyAr: z.string().min(1).optional(),
  coverMediaId: z.string().nullable().optional(),
  published: z.boolean().optional(),
  publishedAt: z.string().datetime().optional(),
  sortOrder: z.number().int().optional(),
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
  const update: Prisma.JournalPostUpdateInput = {};
  if (d.slug !== undefined) update.slug = d.slug;
  if (d.titleEn !== undefined) update.titleEn = d.titleEn;
  if (d.titleAr !== undefined) update.titleAr = d.titleAr;
  if (d.excerptEn !== undefined) update.excerptEn = d.excerptEn;
  if (d.excerptAr !== undefined) update.excerptAr = d.excerptAr;
  if (d.bodyEn !== undefined) update.bodyEn = d.bodyEn;
  if (d.bodyAr !== undefined) update.bodyAr = d.bodyAr;
  if (d.coverMediaId !== undefined) {
    update.coverMedia = d.coverMediaId ? { connect: { id: d.coverMediaId } } : { disconnect: true };
  }
  if (d.published !== undefined) update.published = d.published;
  if (d.publishedAt !== undefined) update.publishedAt = new Date(d.publishedAt);
  if (d.sortOrder !== undefined) update.sortOrder = d.sortOrder;

  const before = await prisma.journalPost.findUnique({ where: { id }, select: { slug: true } });
  const item = await prisma.journalPost.update({ where: { id }, data: update });
  revalidatePublicPages({
    journalSlug: item.slug,
    previousJournalSlug: before?.slug && before.slug !== item.slug ? before.slug : undefined,
  });
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, ctx: Params) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const { id } = await ctx.params;
  const row = await prisma.journalPost.findUnique({ where: { id }, select: { slug: true } });
  await prisma.journalPost.delete({ where: { id } });
  revalidatePublicPages({ journalSlug: row?.slug });
  return NextResponse.json({ ok: true });
}
