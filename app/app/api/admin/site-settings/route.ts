import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

/** Empty string clears; omitted key leaves field unchanged in PATCH. */
const optionalUrl = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    if (v === "" || v === null) return null;
    return v;
  });

const patchSchema = z.object({
  brandName: z.string().min(1).optional(),
  footerTaglineEn: z.string().nullable().optional(),
  footerTaglineAr: z.string().nullable().optional(),
  footerEmail: z.string().nullable().optional(),
  footerPhone: z.string().max(80).nullable().optional(),
  instagramUrl: optionalUrl,
  whatsappUrl: optionalUrl,
  mapEmbedUrl: optionalUrl,
  mapPageUrl: optionalUrl,
  footerLocationLine: z.string().nullable().optional(),
  footerBookLabelEn: z.string().min(1).optional(),
  footerBookLabelAr: z.string().min(1).optional(),
  copyrightName: z.string().min(1).optional(),
  heroEyebrowEn: z.string().nullable().optional(),
  heroEyebrowAr: z.string().nullable().optional(),
  navHomeEn: z.string().min(1).optional(),
  navHomeAr: z.string().min(1).optional(),
  navPortfolioEn: z.string().min(1).optional(),
  navPortfolioAr: z.string().min(1).optional(),
  navServicesEn: z.string().min(1).optional(),
  navServicesAr: z.string().min(1).optional(),
  navAboutEn: z.string().min(1).optional(),
  navAboutAr: z.string().min(1).optional(),
  navContactEn: z.string().min(1).optional(),
  navContactAr: z.string().min(1).optional(),
  navMenuLabelEn: z.string().min(1).optional(),
  navMenuLabelAr: z.string().min(1).optional(),
  defaultMetaTitleEn: z.string().nullable().optional(),
  defaultMetaTitleAr: z.string().nullable().optional(),
  defaultMetaDescriptionEn: z.string().nullable().optional(),
  defaultMetaDescriptionAr: z.string().nullable().optional(),
});

export async function GET() {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  let row = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (!row) {
    row = await prisma.siteSettings.create({ data: { id: "singleton" } });
  }
  return NextResponse.json({ settings: row });
}

export async function PATCH(request: Request) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });
  revalidatePublicPages();
  return NextResponse.json({ settings });
}
