import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeroIntro } from "@/components/page-hero-intro";
import { getPageHeroMedia, getPageSectionMap } from "@/lib/data";
import { PageHeroPlacement } from "@/lib/generated/prisma/client";
import { buildPageMetadata } from "@/lib/seo";
import { pickPageContent } from "@/lib/locale";
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
  return buildPageMetadata({ locale, seoSection: "about", path: `/${locale}/about` });
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const [about, pageHero] = await Promise.all([
    getPageSectionMap("about"),
    getPageHeroMedia(PageHeroPlacement.ABOUT_HERO),
  ]);
  const story = pickPageContent(locale, about["story"]);
  const aside = pickPageContent(locale, about["aside_practice"]);
  const kicker = pickPageContent(locale, about["page_kicker"]);

  const detailSections = Object.entries(about)
    .filter(([key]) => key.startsWith("detail_"))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, row]) => pickPageContent(locale, row))
    .filter((block) => block.body);

  return (
    <>
      <PageHeroIntro locale={locale} hero={pageHero} className="editorial-section pb-10 pt-28 md:pb-14 md:pt-36">
        <header className="max-w-[40rem]">
          {kicker.title ? (
            <p className="text-[10px] uppercase tracking-[0.42em] text-muted">{kicker.title}</p>
          ) : null}
          <h1 className="font-display mt-10 text-[clamp(2.5rem,5vw,4rem)] font-medium leading-[1.06] tracking-[-0.03em]">
            {story.title}
          </h1>
        </header>
      </PageHeroIntro>

      <div className="editorial-section grid gap-24 pb-28 pt-8 md:grid-cols-12 md:gap-20 md:pb-36 md:pt-12">
        <div className="md:col-span-7">
          {story.body ? (
            <p className="editorial-prose text-lg font-light md:text-xl">{story.body}</p>
          ) : null}
          <div className="mt-20 space-y-10 text-sm font-light leading-[1.9] text-ink-muted md:text-[0.9375rem]">
            {detailSections.map((block, i) => (
              <p key={i}>{block.body}</p>
            ))}
          </div>
        </div>
        <aside className="md:col-span-5">
          <div className="border border-line/60 bg-surface p-10 md:p-12">
            {aside.title ? (
              <p className="text-[10px] uppercase tracking-[0.35em] text-muted">{aside.title}</p>
            ) : null}
            {aside.body ? (
              <div className="mt-8 whitespace-pre-line text-sm font-light leading-[1.85] text-ink-muted">{aside.body}</div>
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}
