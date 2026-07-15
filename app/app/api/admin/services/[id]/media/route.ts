import { NextResponse } from "next/server";
import { z } from "zod";
import { MediaType } from "@/lib/generated/prisma/client";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { revalidatePublicPages } from "@/lib/revalidate-public";

const patchBody = z
  .object({
    /** Ordered media IDs (first = cover on /services). Duplicates ignored; empty clears gallery. */
    mediaIds: z.array(z.string().min(1)).max(40),
  })
  .strict();

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Params) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const { id: serviceId } = await ctx.params;
  const json = await request.json().catch(() => null);
  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const seen = new Set<string>();
  const uniqueIds: string[] = [];
  for (const mid of parsed.data.mediaIds) {
    if (seen.has(mid)) continue;
    seen.add(mid);
    uniqueIds.push(mid);
  }

  if (uniqueIds.length > 0) {
    const mediaRows = await prisma.media.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, type: true },
    });
    const byId = new Map(mediaRows.map((m) => [m.id, m]));
    for (const mid of uniqueIds) {
      const m = byId.get(mid);
      if (!m) {
        return NextResponse.json({ error: `Unknown media id: ${mid}` }, { status: 400 });
      }
      if (m.type !== MediaType.IMAGE) {
        return NextResponse.json({ error: `Only images allowed on services (id ${mid} is ${m.type})` }, { status: 400 });
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.serviceMedia.deleteMany({ where: { serviceId } });
    let order = 0;
    for (const mediaId of uniqueIds) {
      await tx.serviceMedia.create({
        data: { serviceId, mediaId, sortOrder: order, active: true },
      });
      order += 1;
    }
  });

  const item = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      serviceMedia: { orderBy: { sortOrder: "asc" }, include: { media: true } },
    },
  });

  revalidatePublicPages({ serviceSlug: service.slug });
  return NextResponse.json({ item });
}
