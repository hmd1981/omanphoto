/**
 * Exit 0 if the database has no users (Docker should run full seed).
 * Exit 1 if at least one user exists (skip seed on restart).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const n = await prisma.user.count();
  process.exit(n === 0 ? 0 : 1);
}

main()
  .catch(() => process.exit(1))
  .finally(() => prisma.$disconnect());
