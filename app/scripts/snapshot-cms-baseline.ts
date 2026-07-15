/**
 * Export live CMS state to prisma/cms-baseline.json (commit after intentional site changes).
 * Run: cd app && npx tsx scripts/snapshot-cms-baseline.ts
 */

import { exportCmsBaseline, writeCmsBaseline } from "../lib/cms-baseline";
import { prisma } from "../lib/prisma";


async function main() {
  const baseline = await exportCmsBaseline(prisma);
  const file = writeCmsBaseline(baseline);
  console.log(
    JSON.stringify(
      {
        file,
        capturedAt: baseline.capturedAt,
        categories: baseline.categories.length,
        media: baseline.media.length,
        pageContent: baseline.pageContent.length,
        services: baseline.services.length,
        journalPosts: baseline.journalPosts.length,
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
