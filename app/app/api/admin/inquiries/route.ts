import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;
  const items = await prisma.contactInquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ items });
}
