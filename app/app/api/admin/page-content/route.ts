import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

const createSchema = z.object({
  pageKey: z.string().min(1),
  sectionKey: z.string().min(1),
  titleEn: z.string().nullable().optional(),
  titleAr: z.string().nullable().optional(),
  bodyEn: z.string().nullable().optional(),
  bodyAr: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
});

export async function GET() {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const items = await prisma.pageContent.findMany({
    orderBy: [{ pageKey: "asc" }, { sortOrder: "asc" }],
  });
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
  const item = await prisma.pageContent.create({ data: parsed.data });
  revalidatePublicPages();
  return NextResponse.json({ item });
}
