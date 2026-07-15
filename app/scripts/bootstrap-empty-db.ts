/**
 * First boot on an empty database: restore cms-baseline.json + ensure admin user exists.
 */
import bcrypt from "bcryptjs";

import { cmsBaselineExists, importCmsBaseline, readCmsBaseline } from "../lib/cms-baseline";
import { prisma } from "../lib/prisma";


async function main() {
  if (!cmsBaselineExists()) {
    console.error("bootstrap-empty-db: missing prisma/cms-baseline.json");
    process.exit(1);
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword?.length) {
    console.error("bootstrap-empty-db: ADMIN_PASSWORD is required");
    process.exit(1);
  }

  const baseline = readCmsBaseline();
  await importCmsBaseline(prisma, baseline);

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: "admin@omanphoto.com" },
    update: { name: "Studio Admin" },
    create: {
      email: "admin@omanphoto.com",
      passwordHash,
      name: "Studio Admin",
    },
  });

  console.log(`bootstrap-empty-db: restored CMS from ${baseline.capturedAt}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
