import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin-api";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { validateNewPassword } from "@/lib/password-policy";
import { prisma } from "@/lib/prisma";

const bodySchema = z
  .object({
    currentPassword: z.string().min(1).max(512),
    newPassword: z.string().min(1).max(512),
    confirmPassword: z.string().min(1).max(512),
  })
  .strict();

export async function PATCH(request: Request) {
  const gate = await requireAdminUser();
  if ("error" in gate) return gate.error;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", code: "VALIDATION" }, { status: 400 });
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data;
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match.", code: "MISMATCH" }, { status: 400 });
  }

  const policy = validateNewPassword(newPassword);
  if (!policy.ok) {
    return NextResponse.json({ error: policy.message, code: "POLICY" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: gate.user.id } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "NO_USER" }, { status: 401 });
  }

  const currentOk = await verifyPassword(currentPassword, user.passwordHash);
  if (!currentOk) {
    return NextResponse.json({ error: "Current password is incorrect.", code: "CURRENT_INVALID" }, { status: 401 });
  }

  const sameAsOld = await verifyPassword(newPassword, user.passwordHash);
  if (sameAsOld) {
    return NextResponse.json({ error: "New password must differ from the current password.", code: "SAME" }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
