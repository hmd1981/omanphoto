import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

const patchSchema = z.object({
  pageKey: z.string().min(1).optional(),
  sectionKey: z.string().min(1).optional(),
  titleEn: z.string().nullable().optional(),
  titleAr: z.string().nullable().optional(),
  bodyEn: z.string().nullable().optional(),
  bodyAr: z.string().nullable().optional(),
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
  const item = await prisma.pageContent.update({ where: { id }, data: parsed.data });
  revalidatePublicPages();
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, ctx: Params) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const { id } = await ctx.params;
  await prisma.pageContent.delete({ where: { id } });
  revalidatePublicPages();
  return NextResponse.json({ ok: true });
}
