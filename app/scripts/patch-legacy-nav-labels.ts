import { prisma } from "../lib/prisma";
/**
 * One-time style fix: nav labels were stored in DB as "Work" / "الأعمال".
 * Deploying new app code does not rewrite SiteSettings — patch on container start.
 */



async function main() {
  const s = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  if (!s) return;

  const en = s.navPortfolioEn === "Work" ? "Galleries" : s.navPortfolioEn;
  const ar = s.navPortfolioAr === "الأعمال" ? "المعارض" : s.navPortfolioAr;

  if (en !== s.navPortfolioEn || ar !== s.navPortfolioAr) {
    await prisma.siteSettings.update({
      where: { id: "singleton" },
      data: { navPortfolioEn: en, navPortfolioAr: ar },
    });
    console.log("[patch-legacy-nav-labels] Updated portfolio nav to Galleries / المعارض");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
