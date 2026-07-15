import { prisma } from "../lib/prisma";
/**
 * Gulf Arabic copy + media title fixes for production CMS.
 * Safe to re-run; only updates known stale strings.
 */



const MEDIA_TITLE_MAP: Record<string, string> = {
  Portrait: "بورتريه",
  Fashion: "أزياء",
  Street: "الشارع",
  "Street Photography": "تصوير الشارع",
};

async function patchMediaTitles() {
  const media = await prisma.media.findMany({ select: { id: true, titleAr: true } });
  let n = 0;
  for (const row of media) {
    let next = row.titleAr;
    if (MEDIA_TITLE_MAP[next]) {
      next = MEDIA_TITLE_MAP[next];
    } else if (next.startsWith("Home hero · Image ·")) {
      next = "لقطة رئيسية";
    }
    if (next !== row.titleAr) {
      await prisma.media.update({ where: { id: row.id }, data: { titleAr: next } });
      n++;
    }
  }
  console.log(`[patch-arabic-polish] media titleAr: ${n} rows`);
}

async function main() {
  await prisma.siteSettings.update({
    where: { id: "singleton" },
    data: {
      navContactAr: "تواصل",
      footerTaglineAr: "تصوير وفيلم بهدوء. مسقط · بحجز مسبق.",
    },
  });

  await prisma.heroSettings.update({
    where: { id: "singleton" },
    data: {
      overlaySubtitleAr:
        "تصوير وفيلم للي يهتمون بالتفاصيل والخصوصية — شغل يبقى بعد ما ينتهي اليوم.",
      ctaLabelAr: "استعرض المعارض",
    },
  });

  const pagePatches: Array<{ sectionKey: string; data: { titleAr?: string; bodyAr?: string } }> = [
    {
      sectionKey: "intro",
      data: {
        bodyAr:
          "استوديو في مسقط للصورة والفيلم — أفراح، علامات، وقطاعات. شغل تحريري بهدوء وعين ما تميل للزحمة.",
      },
    },
    {
      sectionKey: "label_featured",
      data: {
        titleAr: "تخصّصاتنا",
        bodyAr: "من الأعراس والعلامات إلى القطاعات — مختارات من شغلنا.",
      },
    },
    {
      sectionKey: "cta_portfolio",
      data: {
        bodyAr: "تصفّح المشاريع كاملة — من الفكرة إلى آخر لقطة.",
      },
    },
    {
      sectionKey: "cta_services",
      data: {
        bodyAr: "تعرّف على خدماتنا: النطاق، المخرجات، والمدة.",
      },
    },
  ];

  for (const { sectionKey, data } of pagePatches) {
    await prisma.pageContent.updateMany({
      where: { pageKey: "home", sectionKey },
      data,
    });
  }

  const categoryPatches: Array<{ slug: string; nameAr?: string; descriptionAr?: string }> = [
    {
      slug: "gastronomy",
      nameAr: "تصوير الطعام",
      descriptionAr:
        "نبرز الطبق والتفاصيل والألوان — بأسلوب يليق بالمطاعم والضيافة والعلامات.",
    },
    {
      slug: "fashion-photography",
      nameAr: "أزياء",
      descriptionAr:
        "تصوير أزياء للعلامات والمصممين والحملات — إضاءة مضبوطة وتكوين يعكس الهوية، مو بس الشكل.",
    },
    {
      slug: "street-photography",
      descriptionAr:
        "لحظات الشارع كما هي — حياة يومية وثقافة المدينة من زاوية فنية ووثائقية.",
    },
    {
      slug: "social-media-content",
      nameAr: "محتوى المنصات",
      descriptionAr:
        "فيديو وصور قصيرة لإنستغرام وتيك توك والحملات الرقمية — سريعة في الجذب، راقية في الشكل.",
    },
  ];

  for (const { slug, ...data } of categoryPatches) {
    await prisma.category.updateMany({ where: { slug }, data });
  }

  const servicePatches: Array<{ slug: string; titleAr?: string; descriptionAr?: string }> = [
    {
      slug: "fashion-photography",
      titleAr: "تصوير أزياء",
      descriptionAr:
        "تصوير أزياء للعلامات والمصممين والحملات — إضاءة وتكوين يعكسون الهوية. جلسات في الاستوديو أو في مواقع مسقط، مع توجيه كامل للأسلوب والحركة.",
    },
    {
      slug: "wedding-photography",
      descriptionAr:
        "نغطي الزفاف والاحتفال بعدسة هادئة — صور ترجع لها، ما تمرّ بسرعة على الشاشة.",
    },
    {
      slug: "event-coverage",
      descriptionAr:
        "حفلات وإطلاقات ومناسبات خاصة برصانة — والتسليم جاهز للإعلام أو القنوات الداخلية أو أرشيفك.",
    },
    {
      slug: "industrial-photography",
      descriptionAr:
        "منشآت وعمليات وفرق — صورة واضحة وتكوين محكوم للتقارير والعروض وثقة العلامة.",
    },
  ];

  for (const { slug, ...data } of servicePatches) {
    await prisma.service.updateMany({ where: { slug }, data });
  }

  await patchMediaTitles();
  console.log("[patch-arabic-polish] Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
