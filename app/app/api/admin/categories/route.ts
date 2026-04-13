import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

const createSchema = z.object({
  nameEn: z.string().min(1).optional(),
  nameAr: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  descriptionEn: z.string().nullable().optional(),
  descriptionAr: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  published: z.boolean().optional(),
});

function namesFrom(input: z.infer<typeof createSchema>): { nameEn: string; nameAr: string } | null {
  const n = input.name?.trim();
  const en = (input.nameEn ?? n ?? "").trim();
  const ar = (input.nameAr ?? n ?? en).trim();
  if (!en) return null;
  return { nameEn: en, nameAr: ar || en };
}

export async function GET() {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const items = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
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
  const names = namesFrom(parsed.data);
  if (!names) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const descEn = parsed.data.descriptionEn ?? parsed.data.description ?? null;
  const descAr = parsed.data.descriptionAr ?? parsed.data.description ?? null;
  const row = await prisma.category.create({
    data: {
      ...names,
      slug: parsed.data.slug,
      descriptionEn: descEn,
      descriptionAr: descAr ?? descEn,
      sortOrder: parsed.data.sortOrder ?? 0,
      published: parsed.data.published ?? true,
    },
  });
  revalidatePublicPages();
  return NextResponse.json({ item: row });
}
