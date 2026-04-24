import { NextResponse } from "next/server";
import { z } from "zod";
import { MediaType, PageHeroPlacement } from "@prisma/client";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

const placementEnum = z.nativeEnum(PageHeroPlacement);

const patchBody = z
  .object({
    placement: placementEnum,
    active: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(999).optional(),
    mediaType: z.nativeEnum(MediaType).optional(),
    imageMediaId: z.string().nullable().optional(),
    videoMediaId: z.string().nullable().optional(),
    videoUrl: z.string().nullable().optional(),
  })
  .strict();

function emptyToNull(v: string | null | undefined) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export async function GET() {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const supportedPlacements = Object.values(PageHeroPlacement);
  const items = await prisma.pageHeroMedia.findMany({
    include: { imageMedia: true, videoMedia: true },
    orderBy: [{ sortOrder: "asc" }, { placement: "asc" }],
  });
  return NextResponse.json({ items, supportedPlacements });
}

export async function PATCH(request: Request) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const json = await request.json().catch(() => null);
  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { placement, ...rest } = parsed.data;
  const existing = await prisma.pageHeroMedia.findUnique({ where: { placement } });
  const mediaType = rest.mediaType ?? existing?.mediaType ?? MediaType.IMAGE;

  const imageMediaId =
    mediaType === MediaType.IMAGE
      ? rest.imageMediaId !== undefined
        ? emptyToNull(rest.imageMediaId)
        : existing?.imageMediaId ?? null
      : null;

  const videoMediaId =
    mediaType === MediaType.VIDEO
      ? rest.videoMediaId !== undefined
        ? emptyToNull(rest.videoMediaId)
        : existing?.videoMediaId ?? null
      : null;

  const videoUrl =
    mediaType === MediaType.VIDEO
      ? emptyToNull(rest.videoUrl !== undefined ? rest.videoUrl : existing?.videoUrl ?? null)
      : null;

  const item = await prisma.pageHeroMedia.upsert({
    where: { placement },
    create: {
      placement,
      active: rest.active ?? true,
      sortOrder: rest.sortOrder ?? 0,
      mediaType,
      imageMediaId,
      videoMediaId,
      videoUrl,
    },
    update: {
      ...(rest.active !== undefined ? { active: rest.active } : {}),
      ...(rest.sortOrder !== undefined ? { sortOrder: rest.sortOrder } : {}),
      mediaType,
      imageMediaId,
      videoMediaId,
      videoUrl,
    },
    include: { imageMedia: true, videoMedia: true },
  });

  revalidatePublicPages();
  return NextResponse.json({ item });
}
