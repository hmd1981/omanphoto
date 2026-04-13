import { NextResponse } from "next/server";
import { z } from "zod";
import { InquiryStatus } from "@prisma/client";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const patchSchema = z
  .object({
    status: z.nativeEnum(InquiryStatus),
  })
  .strict();

const cuid = z.string().cuid();

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Params) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const { id: rawId } = await ctx.params;
  const idParsed = cuid.safeParse(rawId);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid inquiry id" }, { status: 400 });
  }
  const id = idParsed.data;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const item = await prisma.contactInquiry.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ item });
}
