import { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { getSessionFromCookies } from "./auth";
import { prisma } from "./prisma";

export async function requireAdminUser(): Promise<{ user: User } | { error: NextResponse }> {
  const session = await getSessionFromCookies();
  if (!session) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user };
}
