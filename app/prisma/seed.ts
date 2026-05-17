import { PageHeroPlacement, PrismaClient, MediaType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cmsBaselineExists, shouldPreserveCms } from "../lib/cms-baseline";
import { journalPostSeeds, serviceExtendedContent, supplementalPageBits } from "./seed-content";

const prisma = new PrismaClient();

/** Google Maps embed (contact page iframe `src`) + “Open in Maps” link for the same place */
const MAP_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3655.369928523803!2d58.48207581215373!3d23.626919478666178!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e91f9a2c012b881%3A0x3c7e13c641358cf!2sEstio%20technology%20development!5e0!3m2!1sen!2som!4v1776101745752!5m2!1sen!2som";
const MAP_PAGE_URL =
  "https://www.google.com/maps/search/?api=1&query=23.626919478666178%2C58.48207581215373";

const gray = (seed: string, w = 1600, h = 1000) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}?grayscale`;

/** Full demo seed (picsum placeholders, hero overwrite) — never on production deploy. */
const seedDemo = process.env.OMANPHOTO_SEED_DEMO === "1";

/** AdSense/legal/journal copy only — safe to run on production. */
async function seedContentOnly() {
  for (const p of supplementalPageBits) {
    await prisma.pageContent.upsert({
      where: { pageKey_sectionKey: { pageKey: p.pageKey, sectionKey: p.sectionKey } },
      update: {
        titleEn: p.titleEn,
        titleAr: p.titleAr,
        bodyEn: p.bodyEn,
        bodyAr: p.bodyAr,
        sortOrder: p.sortOrder,
        published: true,
      },
      create: { ...p, published: true },
    });
  }

  for (const j of journalPostSeeds) {
    await prisma.journalPost.upsert({
      where: { slug: j.slug },
      update: {
        titleEn: j.titleEn,
        titleAr: j.titleAr,
        excerptEn: j.excerptEn,
        excerptAr: j.excerptAr,
        bodyEn: j.bodyEn,
        bodyAr: j.bodyAr,
        sortOrder: j.sortOrder,
        published: true,
      },
      create: { ...j, published: true },
    });
  }

  for (const [slug, extra] of Object.entries(serviceExtendedContent)) {
    const existing = await prisma.service.findUnique({ where: { slug } });
    if (!existing) continue;
    await prisma.service.update({
      where: { slug },
      data: extra,
    });
  }

  console.log("Content-only seed complete (privacy, terms, journal, service FAQs — CMS untouched).");
}

async function main() {
  if (seedDemo && cmsBaselineExists()) {
    console.error(
      "FATAL: OMANPHOTO_SEED_DEMO=1 is blocked while prisma/cms-baseline.json exists (production CMS snapshot).",
    );
    console.error("Remove the baseline file only on a fresh dev machine, or unset OMANPHOTO_SEED_DEMO.");
    process.exit(1);
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 1) {
    console.error("FATAL: ADMIN_PASSWORD is missing.");
    console.error('Set it in .env or run: ADMIN_PASSWORD="admin" npm run db:seed');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: "admin@omanphoto.com" },
    /** Never overwrite password on re-seed — use Admin → Change password or PATCH API. */
    update: { name: "Studio Admin" },
    create: {
      email: "admin@omanphoto.com",
      passwordHash,
      name: "Studio Admin",
    },
  });

  if (shouldPreserveCms() && !seedDemo) {
    console.log(
      "CMS preserved (OMANPHOTO_PRESERVE_CMS=1 or prisma/cms-baseline.json). Skipping hero, media, categories, and page copy.",
    );
    console.log("To refresh the saved snapshot after admin edits: npm run cms:snapshot");
    return;
  }

  const siteDefaults = {
      brandName: "Oman Photo",
      footerTaglineEn:
        "Luxury photography and cinematic production. Muscat · By appointment.",
      footerTaglineAr: "تصوير فاخر وإنتاج سينمائي. مسقط · بموعد مسبق.",
      footerEmail: "info@omanphoto.com",
      footerPhone: "+96893376940",
      instagramUrl: "https://www.instagram.com/masterpiece_proshots/",
      whatsappUrl: "https://wa.me/message/NBV22R27A46TB1",
      mapEmbedUrl: MAP_EMBED_URL,
      mapPageUrl: MAP_PAGE_URL,
      footerLocationLine: "Muscat, Sultanate of Oman",
      footerBookLabelEn: "Begin a commission",
      footerBookLabelAr: "ابدأ مشروعك",
      copyrightName: "Oman Photo",
      heroEyebrowEn: "Muscat · Sultanate of Oman",
      heroEyebrowAr: "مسقط · سلطنة عُمان",
      navHomeEn: "Home",
      navHomeAr: "الرئيسية",
      navPortfolioEn: "Galleries",
      navPortfolioAr: "المعارض",
      navServicesEn: "Services",
      navServicesAr: "الخدمات",
      navAboutEn: "Studio",
      navAboutAr: "الاستوديو",
      navContactEn: "Enquire",
      navContactAr: "استفسار",
      navMenuLabelEn: "Menu",
      navMenuLabelAr: "القائمة",
      defaultMetaTitleEn: "Oman Photo — Photography & cinematic production",
      defaultMetaTitleAr: "عُمان فوتو — تصوير وإنتاج سينمائي",
      defaultMetaDescriptionEn:
        "A Muscat studio for editorial photography and film—weddings, events, industry, and brands. Black & white. Appointment only.",
      defaultMetaDescriptionAr:
        "استوديو في مسقط للتصوير التحريري والفيلم: أفراح، فعاليات، قطاعات، وعلامات. أبيض وأسود. بموعد مسبق.",
  };

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: seedDemo ? siteDefaults : {},
    create: { id: "singleton", ...siteDefaults },
  });

  if (!seedDemo) {
    console.log(
      "Content-only seed: skipping demo media/hero/categories (set OMANPHOTO_SEED_DEMO=1 for full demo seed).",
    );
  }

  if (!seedDemo) {
    await seedContentOnly();
    return;
  }

  const categories: {
    nameEn: string;
    nameAr: string;
    slug: string;
    descriptionEn: string;
    descriptionAr: string;
    sortOrder: number;
  }[] = [
    {
      nameEn: "Weddings",
      nameAr: "أفراح",
      slug: "weddings",
      descriptionEn: "Ceremony, portraits, and the quiet in-between—editorial, never theatrical.",
      descriptionAr: "المراسم والبورتريه وما بينهما بهدوء — تحريري بلا مبالغة.",
      sortOrder: 10,
    },
    {
      nameEn: "Events",
      nameAr: "فعاليات",
      slug: "events",
      descriptionEn: "Corporate and private occasions, documented with restraint.",
      descriptionAr: "مناسبات مؤسسية وخاصة، بتغطية رصينة.",
      sortOrder: 20,
    },
    {
      nameEn: "Industrial",
      nameAr: "صناعي",
      slug: "industrial",
      descriptionEn: "Facilities, infrastructure, and teams in clear, deliberate light.",
      descriptionAr: "منشآت وبنية تحتية وفرق بضوء واضح وبإيقاع مدروس.",
      sortOrder: 30,
    },
    {
      nameEn: "Commercial",
      nameAr: "تجاري",
      slug: "commercial",
      descriptionEn: "Campaigns, lookbooks, and portraiture aligned to the brand.",
      descriptionAr: "حملات وكتالوجات وبورتريه بما يتماشى مع هوية العلامة.",
      sortOrder: 40,
    },
    {
      nameEn: "Motion",
      nameAr: "حركة",
      slug: "film",
      descriptionEn: "Cinematic cuts, interviews, and production stills.",
      descriptionAr: "مقاطع سينمائية ومقابلات وصور إنتاج.",
      sortOrder: 50,
    },
  ];

  const catRecords = [];
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        nameEn: c.nameEn,
        nameAr: c.nameAr,
        descriptionEn: c.descriptionEn,
        descriptionAr: c.descriptionAr,
        sortOrder: c.sortOrder,
        published: true,
      },
      create: { ...c, published: true },
    });
    catRecords.push(row);
  }

  const wedding = catRecords.find((c) => c.slug === "weddings")!;
  const events = catRecords.find((c) => c.slug === "events")!;
  const industrial = catRecords.find((c) => c.slug === "industrial")!;

  const mediaSeeds = [
    {
      titleEn: "Coastal ceremony",
      titleAr: "احتفال على الساحل",
      type: MediaType.IMAGE,
      categoryId: wedding.id,
      featured: true,
      sortOrder: 10,
      url: gray("wed1"),
    },
    {
      titleEn: "Veil, morning light",
      titleAr: "الطرحة وضوء الصباح",
      type: MediaType.IMAGE,
      categoryId: wedding.id,
      featured: false,
      sortOrder: 20,
      url: gray("wed2"),
    },
    {
      titleEn: "Gala evening",
      titleAr: "أمسية حفل",
      type: MediaType.IMAGE,
      categoryId: events.id,
      featured: true,
      sortOrder: 10,
      url: gray("ev1"),
    },
    {
      titleEn: "Summit stage",
      titleAr: "منصة القمة",
      type: MediaType.IMAGE,
      categoryId: events.id,
      featured: false,
      sortOrder: 20,
      url: gray("ev2"),
    },
    {
      titleEn: "Steel and shadow",
      titleAr: "فولاذ وظل",
      type: MediaType.IMAGE,
      categoryId: industrial.id,
      featured: true,
      sortOrder: 10,
      url: gray("ind1"),
    },
    {
      titleEn: "Assembly line",
      titleAr: "خط التجميع",
      type: MediaType.IMAGE,
      categoryId: industrial.id,
      featured: false,
      sortOrder: 20,
      url: gray("ind2"),
    },
    {
      titleEn: "Lookbook I",
      titleAr: "كتالوج أزياء — الجزء الأول",
      type: MediaType.IMAGE,
      categoryId: catRecords.find((c) => c.slug === "commercial")!.id,
      featured: true,
      sortOrder: 10,
      url: gray("com1"),
    },
    {
      titleEn: "Studio portrait",
      titleAr: "بورتريه استوديو",
      type: MediaType.IMAGE,
      categoryId: catRecords.find((c) => c.slug === "commercial")!.id,
      featured: false,
      sortOrder: 20,
      url: gray("com2"),
    },
    {
      titleEn: "Reel teaser",
      titleAr: "مقدمة بصرية",
      type: MediaType.VIDEO,
      categoryId: catRecords.find((c) => c.slug === "film")!.id,
      featured: true,
      sortOrder: 10,
      url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    },
    {
      titleEn: "Production still",
      titleAr: "صورة إنتاج",
      type: MediaType.IMAGE,
      categoryId: catRecords.find((c) => c.slug === "film")!.id,
      featured: false,
      sortOrder: 15,
      url: gray("filmstill"),
    },
  ];

  const mediaRows = [];
  for (const m of mediaSeeds) {
    const existing = await prisma.media.findFirst({
      where: { categoryId: m.categoryId, sortOrder: m.sortOrder },
    });
    const row = existing
      ? await prisma.media.update({
          where: { id: existing.id },
          data: { active: true },
        })
      : await prisma.media.create({
          data: { ...m, active: true },
        });
    mediaRows.push(row);
  }

  const heroImage = mediaRows[0];

  await prisma.heroSettings.upsert({
    where: { id: "singleton" },
    update: {
      mediaType: MediaType.IMAGE,
      imageMediaId: heroImage.id,
      videoMediaId: null,
      videoUrl: null,
      eyebrowEn: "Muscat · Sultanate of Oman",
      eyebrowAr: "مسقط · سلطنة عُمان",
      overlayTitleEn: "Masterpiece is crafted with intent.",
      overlayTitleAr: "مو أي تصوير… هذا شغل يُصنع بذوق.",
      overlaySubtitleEn:
        "Photography and film for clients who expect precision, discretion, and work that endures.",
      overlaySubtitleAr:
        "تصوير وفيلم لمن يبحثون عن الدقة والخصوصية، وعن عمل يدوم بعد انتهاء اليوم.",
      ctaLabelEn: "View the galleries",
      ctaLabelAr: "استعرض المعارض",
      ctaHref: "/portfolio",
    },
    create: {
      id: "singleton",
      mediaType: MediaType.IMAGE,
      imageMediaId: heroImage.id,
      videoMediaId: null,
      videoUrl: null,
      eyebrowEn: "Muscat · Sultanate of Oman",
      eyebrowAr: "مسقط · سلطنة عُمان",
      overlayTitleEn: "Masterpiece is crafted with intent.",
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

  const services = [
    {
      titleEn: "Wedding photography",
      titleAr: "تصوير أفراح",
      slug: "wedding-photography",
      descriptionEn:
        "Ceremonies and celebrations captured with a quiet lens and editorial framing—images worth returning to, not scrolling past.",
      descriptionAr:
        "نغطي لحظات الزفاف والاحتفال بعدسة هادئة وبإطار تحريري — صور تعود إليها، لا تمرّ بسرعة على الشاشة.",
      sortOrder: 10,
    },
    {
      titleEn: "Event coverage",
      titleAr: "تغطية فعاليات",
      slug: "event-coverage",
      descriptionEn:
        "Galas, launches, and private occasions documented with restraint—deliverables shaped for press, internal channels, or your own archive.",
      descriptionAr:
        "حفلات وإطلاقات ومناسبات خاصة برصانة — والتسليم يُهيأ للإعلام أو القنوات الداخلية أو أرشيفك الشخصي.",
      sortOrder: 20,
    },
    {
      titleEn: "Industrial photography",
      titleAr: "تصوير صناعي",
      slug: "industrial-photography",
      descriptionEn:
        "Facilities, processes, and people rendered with technical clarity and compositional control—for reports, tenders, and quiet brand confidence.",
      descriptionAr:
        "منشآت وعمليات وأفراد بصورة واضحة وتكوين محكوم — للتقارير والعروض ولثقة العلامة بهدوء.",
      sortOrder: 30,
    },
    {
      titleEn: "Commercial photography",
      titleAr: "تصوير تجاري",
      slug: "commercial-photography",
      descriptionEn:
        "Campaigns, catalogues, and portraiture aligned to your guidelines—consistent light, a single visual language, production-ready files.",
      descriptionAr:
        "حملات وكتالوجات وبورتريه بما يتماشى مع أدلتكم — إضاءة متناسقة ولغة بصرية واحدة وملفات جاهزة للإنتاج.",
      sortOrder: 40,
    },
    {
      titleEn: "Video production",
      titleAr: "إنتاج فيديو",
      slug: "video-production",
      descriptionEn:
        "Short films, interviews, and social edits with a cinematic grade—sound and picture tuned to the story you need told.",
      descriptionAr:
        "أفلام قصيرة ومقابلات ومقاطع بدرجة سينمائية — نضبط الصوت والصورة على القصة التي تريدون إيصالها.",
      sortOrder: 50,
    },
  ];

  for (const s of services) {
    const extra = serviceExtendedContent[s.slug];
    await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        ...s,
        published: true,
        ...(extra ?? {}),
      },
      create: {
        ...s,
        published: true,
        ...(extra ?? {}),
      },
    });
  }

  const serviceCoverByMediaTitle: [string, string][] = [
    ["wedding-photography", "Coastal ceremony"],
    ["event-coverage", "Gala evening"],
    ["industrial-photography", "Steel and shadow"],
    ["commercial-photography", "Lookbook I"],
    ["video-production", "Production still"],
  ];

  for (const [serviceSlug, mediaTitleEn] of serviceCoverByMediaTitle) {
    const svc = await prisma.service.findUnique({ where: { slug: serviceSlug } });
    const med = await prisma.media.findFirst({ where: { titleEn: mediaTitleEn } });
    if (!svc || !med) continue;
    await prisma.serviceMedia.deleteMany({ where: { serviceId: svc.id } });
    await prisma.serviceMedia.create({
      data: { serviceId: svc.id, mediaId: med.id, sortOrder: 0, active: true },
    });
  }

  const pageBits: {
    pageKey: string;
    sectionKey: string;
    titleEn?: string;
    titleAr?: string;
    bodyEn?: string;
    bodyAr?: string;
    sortOrder: number;
  }[] = [
    {
      pageKey: "home",
      sectionKey: "intro",
      titleEn: "Measured craft",
      titleAr: "إتقان بهدوء",
      bodyEn:
        "Oman Photo is a Muscat studio for still and moving image—weddings, industry, and brands—made with editorial discipline and an exacting, quiet eye.",
      bodyAr:
        "عُمان فوتو استوديو في مسقط للصورة الثابتة والحركة: أفراح، قطاعات، وعلامات — بانضباط تحريري وعين لا تتساهل في التفاصيل.",
      sortOrder: 10,
    },
    {
      pageKey: "home",
      sectionKey: "label_editorial",
      titleEn: "Editorial",
      titleAr: "بروح تحريرية",
      sortOrder: 20,
    },
    {
      pageKey: "home",
      sectionKey: "label_featured",
      titleEn: "By discipline",
      titleAr: "حسب التخصص",
      sortOrder: 30,
    },
    {
      pageKey: "home",
      sectionKey: "portfolio_preview",
      titleEn: "Selected frames",
      titleAr: "لقطات مختارة",
      bodyEn: "Galleries",
      bodyAr: "المعارض",
      sortOrder: 40,
    },
    {
      pageKey: "home",
      sectionKey: "cta_portfolio",
      titleEn: "See all galleries",
      titleAr: "عرض المعارض كاملة",
      sortOrder: 50,
    },
    {
      pageKey: "home",
      sectionKey: "services_preview",
      titleEn: "What we create",
      titleAr: "ما نقدّمه",
      bodyEn: "Capabilities",
      bodyAr: "الخدمات",
      sortOrder: 60,
    },
    {
      pageKey: "home",
      sectionKey: "cta_services",
      titleEn: "Explore services",
      titleAr: "تعرّف على الخدمات",
      sortOrder: 70,
    },
    {
      pageKey: "about",
      sectionKey: "page_kicker",
      titleEn: "Studio",
      titleAr: "الاستوديو",
      sortOrder: 5,
    },
    {
      pageKey: "about",
      sectionKey: "story",
      titleEn: "The practice",
      titleAr: "الممارسة",
      bodyEn:
        "We work as a small atelier: one lead vision, trusted collaborators when scale requires, and a single standard for light, composition, and finish.",
      bodyAr:
        "نعمل كمشغل صغير: رؤية رئيسية واحدة، وشركاء موثوقون عند اتساع النطاق، ومعيار واحد للضوء والتكوين واللمسة النهائية.",
      sortOrder: 10,
    },
    {
      pageKey: "about",
      sectionKey: "detail_1",
      bodyEn:
        "Commissions are accepted by appointment. We favour clear briefs, generous lead time, and clients who care as much about the edit as the shutter.",
      bodyAr:
        "نستقبل المشاريع بموعد. نميل إلى موجز واضح، ووقت كافٍ للتنفيذ، وعملاء يهتمون للتنقيح كما يهتمون للّقطة.",
      sortOrder: 20,
    },
    {
      pageKey: "about",
      sectionKey: "detail_2",
      bodyEn:
        "Deliverables include graded stills, private viewing galleries, and print-ready files. Motion is delivered in formats agreed per project—from ProRes to platform-ready encodes.",
      bodyAr:
        "التسليم يشمل صوراً معالجة، ومعارض خاصة للمعاينة، وملفات جاهزة للطباعة. يُسلَّم الفيديو بصيغ يُتفق عليها لكل مشروع — من ProRes إلى ما يناسب المنصات.",
      sortOrder: 30,
    },
    {
      pageKey: "about",
      sectionKey: "aside_practice",
      titleEn: "Scope",
      titleAr: "النطاق",
      bodyEn:
        "Editorial weddings & private events\nIndustrial & infrastructure\nCommercial campaigns & portraiture\nCinematic video & short-form edits",
      bodyAr:
        "أفراح بروح تحريرية وفعاليات خاصة\nصناعي وبنية تحتية\nحملات تجارية وبورتريه\nفيديو سينمائي ومقاطع قصيرة",
      sortOrder: 40,
    },
    {
      pageKey: "services",
      sectionKey: "page_kicker",
      titleEn: "Services",
      titleAr: "الخدمات",
      sortOrder: 5,
    },
    {
      pageKey: "services",
      sectionKey: "intro",
      titleEn: "A single visual language",
      titleAr: "لغة بصرية واحدة",
      bodyEn:
        "Every commission is built with the same restraint: precise exposure, composed frames, and delivery that belongs in an archive.",
      bodyAr:
        "كل مشروع يُبنى بنفس الروح: تعريض دقيق، إطارات مُحكمة، وتسليم يليق بأرشيف يُحتفى به.",
      sortOrder: 10,
    },
    {
      pageKey: "portfolio",
      sectionKey: "page_kicker",
      titleEn: "Archive",
      titleAr: "أرشيف",
      sortOrder: 5,
    },
    {
      pageKey: "portfolio",
      sectionKey: "intro",
      titleEn: "Galleries",
      titleAr: "المعارض",
      bodyEn:
        "A monochrome study of commissions to date. Refine by discipline; pause on an image to preview motion where it exists.",
      bodyAr:
        "دراسة أحادية اللون لأعمال المشروع حتى اليوم. صفِّح حسب التخصص؛ وثِّت على الصورة لمعاينة الحركة حيث تتوفر.",
      sortOrder: 10,
    },
    {
      pageKey: "contact",
      sectionKey: "page_kicker",
      titleEn: "Contact",
      titleAr: "تواصل",
      sortOrder: 3,
    },
    {
      pageKey: "contact",
      sectionKey: "page_title",
      titleEn: "Enquire",
      titleAr: "استفسار",
      sortOrder: 5,
    },
    {
      pageKey: "contact",
      sectionKey: "note",
      titleEn: "How we reply",
      titleAr: "كيف نرد",
      bodyEn:
        "Share your date, scope, and what matters most. We respond within two business days.",
      bodyAr:
        "أرسل التاريخ ونطاق العمل وما يهمّك في النتيجة. نرد خلال يومي عمل كحدّ أقصى.",
      sortOrder: 10,
    },
    {
      pageKey: "contact",
      sectionKey: "direct",
      titleEn: "Direct",
      titleAr: "مباشر",
      sortOrder: 20,
    },
    {
      pageKey: "contact",
      sectionKey: "form_heading",
      titleEn: "Project details",
      titleAr: "تفاصيل المشروع",
      sortOrder: 30,
    },
    {
      pageKey: "contact",
      sectionKey: "whatsapp_label",
      titleEn: "WhatsApp",
      titleAr: "واتساب",
      sortOrder: 40,
    },
    {
      pageKey: "contact",
      sectionKey: "instagram_label",
      titleEn: "Instagram",
      titleAr: "إنستغرام",
      sortOrder: 50,
    },
    {
      pageKey: "contact",
      sectionKey: "wa_prefill",
      bodyEn: "Hello — I would like to speak with Oman Photo about a commission.",
      bodyAr: "السلام عليكم — أرغب بالتواصل مع عُمان فوتو بخصوص مشروع تصوير أو فيلم قصير.",
      sortOrder: 60,
    },
    {
      pageKey: "ai_studio",
      sectionKey: "page_kicker",
      titleEn: "Tools",
      titleAr: "أدوات",
      sortOrder: 5,
    },
    {
      pageKey: "ai_studio",
      sectionKey: "hero_title",
      titleEn: "AI Studio",
      titleAr: "استوديو الذكاء الاصطناعي",
      sortOrder: 10,
    },
    {
      pageKey: "ai_studio",
      sectionKey: "hero_subtitle",
      sortOrder: 12,
    },
    {
      pageKey: "ai_studio",
      sectionKey: "hero_description",
      bodyEn:
        "A dedicated space for AI-assisted tooling inside Oman Photo’s editorial workflow.",
      bodyAr: "صفحة مخصصة لدمج أدوات الذكاء الاصطناعي في مسار العمل التحريري لدى عمان فوتو.",
      sortOrder: 15,
    },
    {
      pageKey: "book",
      sectionKey: "page_kicker",
      titleEn: "Book",
      titleAr: "الحجز",
      sortOrder: 5,
    },
    {
      pageKey: "book",
      sectionKey: "hero_title",
      titleEn: "Book",
      titleAr: "الحجز",
      sortOrder: 10,
    },
    {
      pageKey: "book",
      sectionKey: "hero_subtitle",
      sortOrder: 12,
    },
    {
      pageKey: "book",
      sectionKey: "hero_description",
      bodyEn: "Send a request through the contact form, or reach us directly.",
      bodyAr: "أرسل الطلب عبر نموذج التواصل، أو راسلنا مباشرة.",
      sortOrder: 15,
    },
    {
      pageKey: "seo",
      sectionKey: "default",
      titleEn: "Oman Photo — Photography & cinematic production",
      titleAr: "عُمان فوتو — تصوير وإنتاج سينمائي",
      bodyEn:
        "A Muscat studio for editorial photography and film—weddings, events, industry, and brands. Black & white. Appointment only.",
      bodyAr:
        "استوديو في مسقط للتصوير التحريري والفيلم: أفراح، فعاليات، قطاعات، وعلامات. أبيض وأسود. بموعد مسبق.",
      sortOrder: 10,
    },
    {
      pageKey: "seo",
      sectionKey: "home",
      titleEn: "Oman Photo — Editorial photography & film",
      titleAr: "عُمان فوتو — تصوير تحريري وفيلم",
      bodyEn:
        "Luxury photography and cinematic production for discerning clients in Oman and the Gulf. By appointment.",
      bodyAr:
        "تصوير فاخر وإنتاج سينمائي لعملاء يقدّرون التفاصيل — في عُمان والخليج. بموعد مسبق.",
      sortOrder: 20,
    },
    {
      pageKey: "seo",
      sectionKey: "about",
      titleEn: "Studio — Oman Photo",
      titleAr: "الاستوديو — عُمان فوتو",
      bodyEn:
        "Practice, process, and deliverables for Oman Photo—still and motion, by appointment.",
      bodyAr:
        "الممارسة وآلية العمل والتسليم في عُمان فوتو — صورة ثابتة وحركة، بموعد.",
      sortOrder: 30,
    },
    {
      pageKey: "seo",
      sectionKey: "portfolio",
      titleEn: "Galleries — Oman Photo",
      titleAr: "المعارض — عُمان فوتو",
      bodyEn:
        "Selected monochrome commissions—weddings, events, industry, commercial, and motion.",
      bodyAr:
        "أعمال مختارة أحادية اللون — أفراح، فعاليات، صناعي، تجاري، وحركة.",
      sortOrder: 40,
    },
    {
      pageKey: "seo",
      sectionKey: "services",
      titleEn: "Services — Oman Photo",
      titleAr: "الخدمات — عُمان فوتو",
      bodyEn:
        "Wedding, event, industrial, commercial, and cinematic video production—Muscat and the Gulf.",
      bodyAr:
        "تصوير أفراح وفعاليات وصناعي وتجاري، وإنتاج فيديو سينمائي — مسقط والخليج.",
      sortOrder: 50,
    },
    {
      pageKey: "seo",
      sectionKey: "contact",
      titleEn: "Enquire — Oman Photo",
      titleAr: "الاستفسار — عُمان فوتو",
      bodyEn:
        "Begin a conversation about your commission. Muscat and abroad by appointment.",
      bodyAr:
        "لنبدأ حواراً حول مشروعك. مسقط وخارجها بموعد مسبق.",
      sortOrder: 60,
    },
    {
      pageKey: "seo",
      sectionKey: "ai_studio",
      titleEn: "AI Studio — Oman Photo",
      titleAr: "استوديو الذكاء الاصطناعي — عُمان فوتو",
      bodyEn: "AI-assisted workflows for photography and production at Oman Photo.",
      bodyAr: "أدوات وخدمات الذكاء الاصطناعي لسير عمل التصوير والإنتاج.",
      sortOrder: 65,
    },
    {
      pageKey: "seo",
      sectionKey: "book",
      titleEn: "Book — Oman Photo",
      titleAr: "الحجز — عُمان فوتو",
      bodyEn: "Book a session or production with Oman Photo.",
      bodyAr: "احجز جلسة أو إنتاجاً مع عُمان فوتو.",
      sortOrder: 70,
    },
  ];

  const allPageBits = [...pageBits, ...supplementalPageBits];

  for (const p of allPageBits) {
    await prisma.pageContent.upsert({
      where: { pageKey_sectionKey: { pageKey: p.pageKey, sectionKey: p.sectionKey } },
      update: {
        titleEn: p.titleEn,
        titleAr: p.titleAr,
        bodyEn: p.bodyEn,
        bodyAr: p.bodyAr,
        sortOrder: p.sortOrder,
        published: true,
      },
      create: { ...p, published: true },
    });
  }

  const coverForJournal = mediaRows[0];
  for (const j of journalPostSeeds) {
    await prisma.journalPost.upsert({
      where: { slug: j.slug },
      update: {
        titleEn: j.titleEn,
        titleAr: j.titleAr,
        excerptEn: j.excerptEn,
        excerptAr: j.excerptAr,
        bodyEn: j.bodyEn,
        bodyAr: j.bodyAr,
        sortOrder: j.sortOrder,
        published: true,
        coverMediaId: coverForJournal?.id ?? null,
      },
      create: {
        ...j,
        published: true,
        coverMediaId: coverForJournal?.id ?? null,
      },
    });
  }

  const pageHeroPlacements: { placement: PageHeroPlacement; sortOrder: number }[] = [
    { placement: PageHeroPlacement.PORTFOLIO_HERO, sortOrder: 10 },
    { placement: PageHeroPlacement.SERVICES_HERO, sortOrder: 20 },
    { placement: PageHeroPlacement.ABOUT_HERO, sortOrder: 30 },
    { placement: PageHeroPlacement.CONTACT_HERO, sortOrder: 40 },
    { placement: PageHeroPlacement.AI_STUDIO_HERO, sortOrder: 50 },
    { placement: PageHeroPlacement.BOOK_HERO, sortOrder: 60 },
  ];
  for (const { placement, sortOrder } of pageHeroPlacements) {
    await prisma.pageHeroMedia.upsert({
      where: { placement },
      update: { sortOrder },
      create: {
        placement,
        sortOrder,
        active: false,
        mediaType: MediaType.IMAGE,
      },
    });
  }

  console.log(
    "Seed complete. Admin email: admin@omanphoto.com (password was set from ADMIN_PASSWORD for new installs only).",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
