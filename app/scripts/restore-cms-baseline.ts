/**
 * Restore CMS from prisma/cms-baseline.json (photos on disk are unchanged).
 * Run: cd app && npx tsx scripts/restore-cms-baseline.ts
 */

import { cmsBaselineExists, importCmsBaseline, readCmsBaseline } from "../lib/cms-baseline";
import { prisma } from "../lib/prisma";


async function main() {
  if (!cmsBaselineExists()) {
    console.error("Missing prisma/cms-baseline.json — run snapshot-cms-baseline.ts first.");
    process.exit(1);
  }
  const baseline = readCmsBaseline();
  await importCmsBaseline(prisma, baseline);
  console.log(
    JSON.stringify(
      {
        restoredFrom: baseline.capturedAt,
        categories: baseline.categories.length,
        media: baseline.media.length,
        heroImageMediaId: baseline.heroSettings?.imageMediaId ?? null,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
