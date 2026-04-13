import { NextResponse } from "next/server";
import { z } from "zod";
import { MediaType } from "@prisma/client";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

const patchSchema = z.object({
  mediaType: z.nativeEnum(MediaType).optional(),
  imageMediaId: z.string().nullable().optional(),
  videoMediaId: z.string().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  eyebrowEn: z.string().nullable().optional(),
  eyebrowAr: z.string().nullable().optional(),
  overlayTitleEn: z.string().optional(),
  overlayTitleAr: z.string().optional(),
  overlaySubtitleEn: z.string().optional(),
  overlaySubtitleAr: z.string().optional(),
  ctaLabelEn: z.string().optional(),
  ctaLabelAr: z.string().optional(),
  ctaHref: z.string().nullable().optional(),
});

export async function GET() {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  let hero = await prisma.heroSettings.findUnique({
    where: { id: "singleton" },
    include: {
      imageMedia: { include: { category: true } },
      videoMedia: { include: { category: true } },
    },
  });
  if (!hero) {
    hero = await prisma.heroSettings.create({
      data: { id: "singleton", mediaType: MediaType.IMAGE },
      include: {
        imageMedia: { include: { category: true } },
        videoMedia: { include: { category: true } },
      },
    });
  }
  return NextResponse.json({ hero });
}

export async function PATCH(request: Request) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const data = parsed.data;
  const empty = (v: string | null | undefined) => (v === "" ? null : v);

  const existing = await prisma.heroSettings.findUnique({ where: { id: "singleton" } });
  const mediaType = data.mediaType ?? existing?.mediaType ?? MediaType.IMAGE;

  const imageMediaId =
    mediaType === MediaType.IMAGE
      ? data.imageMediaId !== undefined
        ? empty(data.imageMediaId)
        : existing?.imageMediaId ?? null
      : null;

  const videoMediaId =
    mediaType === MediaType.VIDEO
      ? data.videoMediaId !== undefined
        ? empty(data.videoMediaId)
        : existing?.videoMediaId ?? null
      : null;

  const videoUrl =
    mediaType === MediaType.VIDEO
      ? empty(data.videoUrl !== undefined ? data.videoUrl : existing?.videoUrl ?? null)
      : null;

  const hero = await prisma.heroSettings.upsert({
    where: { id: "singleton" },
    update: {
      mediaType,
      imageMediaId,
      videoMediaId,
      videoUrl,
      ...(data.eyebrowEn !== undefined ? { eyebrowEn: data.eyebrowEn } : {}),
      ...(data.eyebrowAr !== undefined ? { eyebrowAr: data.eyebrowAr } : {}),
      ...(data.overlayTitleEn !== undefined ? { overlayTitleEn: data.overlayTitleEn } : {}),
      ...(data.overlayTitleAr !== undefined ? { overlayTitleAr: data.overlayTitleAr } : {}),
      ...(data.overlaySubtitleEn !== undefined ? { overlaySubtitleEn: data.overlaySubtitleEn } : {}),
      ...(data.overlaySubtitleAr !== undefined ? { overlaySubtitleAr: data.overlaySubtitleAr } : {}),
      ...(data.ctaLabelEn !== undefined ? { ctaLabelEn: data.ctaLabelEn } : {}),
      ...(data.ctaLabelAr !== undefined ? { ctaLabelAr: data.ctaLabelAr } : {}),
      ...(data.ctaHref !== undefined ? { ctaHref: data.ctaHref } : {}),
    },
    create: {
      id: "singleton",
      mediaType,
      imageMediaId,
      videoMediaId,
      videoUrl,
      eyebrowEn: data.eyebrowEn ?? null,
      eyebrowAr: data.eyebrowAr ?? null,
      overlayTitleEn: data.overlayTitleEn ?? "Masterpiece is crafted with intent.",
      overlayTitleAr: data.overlayTitleAr ?? "مو أي تصوير… هذا شغل يُصنع بذوق.",
      overlaySubtitleEn: data.overlaySubtitleEn ?? null,
      overlaySubtitleAr: data.overlaySubtitleAr ?? null,
      ctaLabelEn: data.ctaLabelEn ?? null,
      ctaLabelAr: data.ctaLabelAr ?? null,
      ctaHref: data.ctaHref ?? null,
    },
    include: {
      imageMedia: { include: { category: true } },
      videoMedia: { include: { category: true } },
    },
  });

  revalidatePublicPages();
  return NextResponse.json({ hero });
}
