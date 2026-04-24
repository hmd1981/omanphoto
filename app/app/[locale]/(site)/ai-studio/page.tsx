import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeroIntro } from "@/components/page-hero-intro";
import { getPageHeroMedia, getPageSectionMap } from "@/lib/data";
import { PageHeroPlacement } from "@prisma/client";
import { buildPageMetadata } from "@/lib/seo";
import { localizedPath, pickPageContent, pickTextWithOptionalFallback } from "@/lib/locale";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  return buildPageMetadata({ locale, seoSection: "ai_studio", path: `/${locale}/ai-studio` });
}

export default async function AiStudioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const [sections, pageHero] = await Promise.all([
    getPageSectionMap("ai_studio"),
    getPageHeroMedia(PageHeroPlacement.AI_STUDIO_HERO),
  ]);

  const kickerRow = sections["page_kicker"];
  const titleRow = sections["hero_title"];
  const subtitleRow = sections["hero_subtitle"];
  const descriptionRow = sections["hero_description"];

  const kicker =
    pickTextWithOptionalFallback(locale, kickerRow?.titleEn, kickerRow?.titleAr) ||
    (locale === "ar" ? "أدوات" : "Tools");
  const title =
    pickTextWithOptionalFallback(locale, titleRow?.titleEn, titleRow?.titleAr) ||
    (locale === "ar" ? "استوديو الذكاء الاصطناعي" : "AI Studio");
  const subtitlePick = pickPageContent(locale, subtitleRow);
  const subtitle = subtitlePick.title || subtitlePick.body;
  const description =
    pickTextWithOptionalFallback(locale, descriptionRow?.bodyEn, descriptionRow?.bodyAr) ||
    (locale === "ar"
      ? "صفحة مخصصة لدمج أدوات الذكاء الاصطناعي في مسار العمل التحريري لدى عمان فوتو."
      : "A dedicated space for AI-assisted tooling inside Oman Photo’s editorial workflow.");

  const footerNote =
    locale === "ar"
      ? "للاستفسارات والمواعيد، انتقل إلى صفحة التواصل."
      : "For appointments and briefs, continue to Contact.";

  return (
    <div className="editorial-section py-20 md:py-28 lg:py-32">
      <PageHeroIntro locale={locale} hero={pageHero} className="">
        <header className="max-w-[44rem]">
          {kicker ? (
            <p className="text-[10px] uppercase tracking-[0.42em] text-muted" data-route="ai-studio">
              {kicker}
            </p>
          ) : null}
          <h1 className="font-display mt-8 text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1.08] tracking-[-0.03em] md:mt-10">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-6 max-w-2xl text-[0.9375rem] font-light leading-[1.85] text-ink-muted md:mt-8 md:text-lg md:leading-[1.9]">
              {subtitle}
            </p>
          ) : null}
          {description ? (
            <p className="editorial-prose mt-10 max-w-xl text-base font-light leading-relaxed text-ink-muted md:mt-12 md:text-lg">
              {description}
            </p>
          ) : null}
        </header>

        <div className="mt-16 max-w-xl border-t border-line/50 pt-12 text-sm font-light leading-relaxed text-ink-muted md:mt-20 md:pt-16">
          <p>{footerNote}</p>
          <Link
            href={localizedPath(locale, "/contact")}
            className="mt-6 inline-flex min-h-[44px] items-center text-[11px] uppercase tracking-[0.28em] text-ink-bright underline-offset-4 transition-colors hover:underline"
          >
            {locale === "ar" ? "التواصل" : "Contact"}
          </Link>
        </div>
      </PageHeroIntro>
    </div>
  );
}
