/**
 * One-off restore: undo destructive db:seed effects on production CMS data.
 * Run: cd app && npx tsx scripts/restore-after-seed.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_TITLES = new Set([
  "Coastal ceremony",
  "Veil, morning light",
  "Gala evening",
  "Summit stage",
  "Steel and shadow",
  "Assembly line",
  "Lookbook I",
  "Studio portrait",
  "Reel teaser",
  "Production still",
]);

async function main() {
  // Prefer the full-size homepage hero (April 2026), not the low-res April 14 duplicate.
  const heroMedia =
    (await prisma.media.findFirst({
      where: { filePath: "7da55576-5fd9-4a35-8314-dd7ddbe9e912.jpg" },
    })) ??
    (await prisma.media.findFirst({
      where: { titleEn: { startsWith: "Home hero · Image" } },
      orderBy: { createdAt: "desc" },
    }));

  await prisma.heroSettings.update({
    where: { id: "singleton" },
    data: {
      mediaType: "IMAGE",
      imageMediaId: heroMedia?.id ?? undefined,
      videoMediaId: null,
      videoUrl: null,
      overlayTitleEn: "Art is crafted with intent.",
      overlayTitleAr: "مو أي تصوير… هذا شغل يُصنع بذوق.",
      overlaySubtitleEn:
        "Photography and film for clients who expect precision, discretion, and work that endures.",
      overlaySubtitleAr:
        "تصوير وفيلم لمن يبحثون عن الدقة والخصوصية، وعن عمل يدوم بعد انتهاء اليوم.",
      ctaLabelEn: "View the galleries",
      ctaLabelAr: "استعرض المعارض",
      ctaHref: "/portfolio",
    },
  });

  const clearedUrls = await prisma.media.updateMany({
    where: { url: { contains: "picsum.photos" } },
    data: { url: null },
  });

  const demoMedia = await prisma.media.findMany({
    where: { titleEn: { in: [...DEMO_TITLES] } },
    select: { id: true },
  });
  if (demoMedia.length) {
    await prisma.media.updateMany({
      where: { id: { in: demoMedia.map((m) => m.id) } },
      data: { featured: false },
    });
  }

  await prisma.pageContent.updateMany({
    where: { pageKey: "home", sectionKey: "intro" },
    data: {
      bodyEn:
        "Oman Photo is a Muscat-based studio for still and moving image—weddings, industry, and brands—defined by editorial discipline and a precise, restrained visual approach.",
      bodyAr:
        "عُمان فوتو استوديو في مسقط للصورة الثابتة والحركة: أفراح، قطاعات، وعلامات — بانضباط تحريري وعين دقيقة ورصينة.",
    },
  });

  await prisma.pageContent.update({
    where: { pageKey_sectionKey: { pageKey: "about", sectionKey: "story" } },
    data: {
      titleEn: "The practice",
      titleAr: "الممارسة",
      bodyEn:
        "We operate as a focused atelier: one guiding vision, supported by a trusted network when scale requires it. Every project follows a unified standard of light, composition, and finish, ensuring consistency across all outputs.",
      bodyAr:
        "نعمل كمشغل مركّز: رؤية رئيسية واحدة، وشبكة موثوقة عند الحاجة. كل مشروع يتبع معياراً واحداً للضوء والتكوين والإنهاء.",
    },
  });

  await prisma.pageContent.update({
    where: { pageKey_sectionKey: { pageKey: "about", sectionKey: "detail_1" } },
    data: {
      bodyEn:
        "Commissions are accepted by appointment. We prioritise clear briefs, considered timelines, and clients who value the final image as much as the moment it is captured.",
      bodyAr:
        "نستقبل المشاريع بموعد. نميل إلى موجز واضح، ووقت كافٍ، وعملاء يهتمون للتنقيح كما يهتمون للّقطة.",
    },
  });

  await prisma.pageContent.update({
    where: { pageKey_sectionKey: { pageKey: "about", sectionKey: "detail_2" } },
    data: {
      bodyEn:
        "Deliverables include graded stills, private viewing galleries, and print-ready files. Motion is delivered in formats agreed per project—from ProRes masters to platform-ready exports.",
      bodyAr:
        "التسليم يشمل صوراً معالجة، ومعارض خاصة للمعاينة، وملفات جاهزة للطباعة. يُسلَّم الفيديو بصيغ يُتفق عليها لكل مشروع.",
    },
  });

  await prisma.pageContent.deleteMany({
    where: {
      pageKey: "about",
      sectionKey: { in: ["detail_3", "detail_4", "detail_5"] },
    },
  });

  console.log(
    JSON.stringify(
      {
        heroMediaId: heroMedia?.id ?? null,
        clearedPicsumUrls: clearedUrls.count,
        demoFeaturedCleared: demoMedia.length,
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
