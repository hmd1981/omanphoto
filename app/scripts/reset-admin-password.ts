/**
 * Set or rotate the studio admin password (bcrypt). Use when you are locked out or Docker seed skipped.
 *
 *   cd app && ADMIN_PASSWORD='admin' npx tsx scripts/reset-admin-password.ts
 *
 * Optional: ADMIN_EMAIL=you@example.com (default admin@omanphoto.com)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@omanphoto.com").trim().toLowerCase();
  const plain = process.env.ADMIN_PASSWORD?.trim();
  if (!plain || plain.length < 1) {
    console.error("ADMIN_PASSWORD must be set (non-empty).");
    console.error('Example: ADMIN_PASSWORD="admin" npx tsx scripts/reset-admin-password.ts');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(plain, 12);
  const updated = await prisma.user.updateMany({
    where: { email },
    data: { passwordHash },
  });

  if (updated.count === 0) {
    await prisma.user.create({
      data: { email, passwordHash, name: "Studio Admin" },
    });
    console.log(`Created admin user ${email}.`);
  } else {
    console.log(`Updated password for ${email}.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
