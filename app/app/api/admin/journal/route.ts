import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

const createSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  titleEn: z.string().min(1),
  titleAr: z.string().min(1),
  excerptEn: z.string().optional(),
  excerptAr: z.string().optional(),
  bodyEn: z.string().min(1),
  bodyAr: z.string().min(1),
  coverMediaId: z.string().nullable().optional(),
  published: z.boolean().optional(),
  publishedAt: z.string().datetime().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const items = await prisma.journalPost.findMany({
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    include: { coverMedia: true },
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
  const d = parsed.data;
  const item = await prisma.journalPost.create({
    data: {
      slug: d.slug,
      titleEn: d.titleEn,
      titleAr: d.titleAr,
      excerptEn: d.excerptEn ?? null,
      excerptAr: d.excerptAr ?? null,
      bodyEn: d.bodyEn,
      bodyAr: d.bodyAr,
      coverMediaId: d.coverMediaId ?? null,
      published: d.published ?? true,
      publishedAt: d.publishedAt ? new Date(d.publishedAt) : new Date(),
      sortOrder: d.sortOrder ?? 0,
    },
  });
  revalidatePublicPages();
  return NextResponse.json({ item });
}
