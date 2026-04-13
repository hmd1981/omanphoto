import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeroIntro } from "@/components/page-hero-intro";
import { PortfolioMasonry } from "@/components/portfolio-masonry";
import { getPageHeroMedia, getPageSection, getPortfolioMedia, getPublishedCategories } from "@/lib/data";
import { PageHeroPlacement } from "@prisma/client";
import { buildPageMetadata } from "@/lib/seo";
import { categoryLabel, localizedPath, pickPageContent } from "@/lib/locale";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { ui } from "@/lib/ui-strings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  return buildPageMetadata({ locale, seoSection: "portfolio", path: `/${locale}/portfolio` });
}

export default async function PortfolioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const { category } = await searchParams;
  const slug = category && category !== "all" ? category : undefined;
  const [categories, items, intro, kicker, pageHero] = await Promise.all([
    getPublishedCategories(),
    getPortfolioMedia(slug),
    getPageSection("portfolio", "intro"),
    getPageSection("portfolio", "page_kicker"),
    getPageHeroMedia(PageHeroPlacement.PORTFOLIO_HERO),
  ]);
  const introP = pickPageContent(locale, intro);
  const kickerP = pickPageContent(locale, kicker);
  const filterAll = ui(locale).portfolioFilterAll;
  const base = localizedPath(locale, "/portfolio");

  return (
    <>
      <PageHeroIntro locale={locale} hero={pageHero} className="editorial-section pb-12 pt-28 md:pb-16 md:pt-36">
        <header className="max-w-[40rem]">
          {kickerP.title ? (
            <p className="text-[10px] uppercase tracking-[0.42em] text-muted">{kickerP.title}</p>
          ) : null}
          <h1 className="font-display mt-10 text-[clamp(2.5rem,5vw,4rem)] font-medium leading-[1.06] tracking-[-0.03em]">
            {introP.title}
          </h1>
          {introP.body ? (
            <p className="editorial-prose mt-12 text-lg font-light md:text-xl">{introP.body}</p>
          ) : null}
        </header>
      </PageHeroIntro>

      <div className="editorial-section flex flex-wrap gap-x-10 gap-y-5 border-b border-line/60 pb-14 pt-4 md:pt-0">
        <FilterLink active={!slug} href={base} label={filterAll} />
        {categories.map((c) => (
          <FilterLink
            key={c.id}
            active={slug === c.slug}
            href={`${base}?category=${c.slug}`}
            label={categoryLabel(locale, c)}
          />
        ))}
      </div>

      <div className="editorial-section pb-28 pt-12 md:pb-36 md:pt-16">
        <PortfolioMasonry items={items} locale={locale} />
      </div>
    </>
  );
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`text-[10px] uppercase tracking-[0.28em] transition-colors duration-300 focus-ring ${
        active ? "text-ink-bright" : "text-muted hover:text-ink-bright"
      }`}
    >
      {label}
    </Link>
  );
}
