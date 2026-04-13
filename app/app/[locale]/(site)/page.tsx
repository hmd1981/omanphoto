import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeHero } from "@/components/home-hero";
import { PortfolioCard } from "@/components/portfolio-card";
import {
  getCategoryCoverMap,
  getFeaturedMediaForHome,
  getHero,
  getPageSectionMap,
  getPublishedCategories,
  getPublishedServices,
  getSiteSettings,
} from "@/lib/data";
import { buildPageMetadata } from "@/lib/seo";
import { categoryDescription, categoryLabel, localizedPath, mediaTitle, pickPageContent, serviceDescription, serviceTitle } from "@/lib/locale";
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
  return buildPageMetadata({ locale, seoSection: "home", path: `/${locale}` });
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const [hero, site, home, categories, preview, services, covers] = await Promise.all([
    getHero(),
    getSiteSettings(),
    getPageSectionMap("home"),
    getPublishedCategories(),
    getFeaturedMediaForHome(6),
    getPublishedServices(),
    getCategoryCoverMap(),
  ]);

  const intro = pickPageContent(locale, home["intro"]);
  const labelEditorial = pickPageContent(locale, home["label_editorial"]).title;
  const labelFeatured = pickPageContent(locale, home["label_featured"]).title;
  const portfolioBlock = pickPageContent(locale, home["portfolio_preview"]);
  const servicesBlock = pickPageContent(locale, home["services_preview"]);
  const ctaPortfolio = pickPageContent(locale, home["cta_portfolio"]).title;
  const ctaServices = pickPageContent(locale, home["cta_services"]).title;
  const videoLabel = ui(locale).video;

  return (
    <div>
      <HomeHero hero={hero} site={site} locale={locale} />

      <section className="editorial-section py-28 md:py-40">
        <div className="grid gap-24 md:grid-cols-12 md:gap-20">
          <div className="md:col-span-5">
            {labelEditorial ? (
              <p className="text-[10px] uppercase tracking-[0.42em] text-muted">{labelEditorial}</p>
            ) : null}
            <h2 className="font-display mt-10 text-[clamp(2.125rem,4.2vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.025em]">
              {intro.title}
            </h2>
          </div>
          <div className="md:col-span-7">
            {intro.body ? (
              <p className="editorial-prose text-base font-light md:text-[1.0625rem]">{intro.body}</p>
            ) : null}
            <div className="mt-20 border-t border-line/70 pt-20">
              {labelFeatured ? (
                <p className="text-[10px] uppercase tracking-[0.35em] text-muted">{labelFeatured}</p>
              ) : null}
              <ul className="mt-12 grid gap-8 sm:grid-cols-2">
                {categories.slice(0, 4).map((c) => {
                  const cover = covers[c.id];
                  const name = categoryLabel(locale, c);
                  const desc = categoryDescription(locale, c);
                  return (
                    <li
                      key={c.id}
                      className="border border-line/60 bg-surface transition-[border-color,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-ink-muted/25 hover:bg-surface"
                    >
                      <Link href={`${localizedPath(locale, "/portfolio")}?category=${c.slug}`} className="group block">
                        <div className="relative aspect-[4/3] overflow-hidden bg-surface">
                          <PortfolioCard media={cover} title={name} videoLabel={videoLabel} />
                        </div>
                        <div className="px-6 py-6">
                          <p className="text-[11px] uppercase tracking-[0.28em] text-muted transition-colors duration-300 group-hover:text-ink-bright">
                            {name}
                          </p>
                          {desc ? (
                            <p className="mt-3 line-clamp-2 text-sm font-light leading-relaxed text-muted">{desc}</p>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line/60 bg-paper">
        <div className="editorial-section py-28 md:py-40">
          <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between md:gap-16">
            <div>
              {portfolioBlock.body ? (
                <p className="text-[10px] uppercase tracking-[0.42em] text-muted">{portfolioBlock.body}</p>
              ) : null}
              <h2 className="font-display mt-8 text-[clamp(2.125rem,4.2vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.025em]">
                {portfolioBlock.title}
              </h2>
            </div>
            {ctaPortfolio ? (
              <Link
                href={localizedPath(locale, "/portfolio")}
                className="shrink-0 text-[10px] uppercase tracking-[0.38em] text-muted transition-colors duration-300 hover:text-ink-bright focus-ring"
              >
                {ctaPortfolio}
              </Link>
            ) : null}
          </div>
          <div className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {preview.map((m) => {
              const t = mediaTitle(locale, m);
              const cn = m.category ? categoryLabel(locale, m.category) : "";
              return (
                <div
                  key={m.id}
                  className="group border border-line/60 bg-surface transition-[border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-ink-muted/20"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                    <PortfolioCard media={m} title={t} videoLabel={videoLabel} />
                  </div>
                  <div className="flex items-baseline justify-between gap-4 px-5 py-5">
                    <p className="text-sm font-light tracking-wide text-ink">{t}</p>
                    <span className="shrink-0 text-[10px] uppercase tracking-[0.24em] text-muted">{cn}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="editorial-section py-28 md:py-40">
        {servicesBlock.body ? (
          <p className="text-[10px] uppercase tracking-[0.42em] text-muted">{servicesBlock.body}</p>
        ) : null}
        <h2 className="font-display mt-8 text-[clamp(2.125rem,4.2vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.025em]">
          {servicesBlock.title}
        </h2>
        <div className="mt-24 grid gap-20 md:grid-cols-2 md:gap-x-16 md:gap-y-24">
          {services.slice(0, 4).map((s) => (
            <div key={s.id} className="border-b border-line/60 pb-20">
              <h3 className="text-lg font-normal tracking-wide text-ink-bright">{serviceTitle(locale, s)}</h3>
              <p className="mt-8 text-sm font-light leading-[1.9] text-ink-muted">{serviceDescription(locale, s)}</p>
            </div>
          ))}
        </div>
        {ctaServices ? (
          <div className="mt-24">
            <Link
              href={localizedPath(locale, "/services")}
              className="inline-block border border-ink-bright/50 px-11 py-3.5 text-[10px] uppercase tracking-[0.4em] text-ink-bright transition-[color,background-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-ink-bright hover:text-paper focus-ring"
            >
              {ctaServices}
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
