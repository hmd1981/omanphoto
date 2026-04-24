import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeroIntro } from "@/components/page-hero-intro";
import { PublicServiceCard } from "@/components/public-service-card";
import { getPageHeroMedia, getPageSection, getPublishedServices } from "@/lib/data";
import { PageHeroPlacement } from "@prisma/client";
import { buildPageMetadata } from "@/lib/seo";
import { pickPageContent, serviceDescription, serviceTitle } from "@/lib/locale";
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
  return buildPageMetadata({ locale, seoSection: "services", path: `/${locale}/services` });
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;

  const [services, intro, kicker, pageHero] = await Promise.all([
    getPublishedServices(),
    getPageSection("services", "intro"),
    getPageSection("services", "page_kicker"),
    getPageHeroMedia(PageHeroPlacement.SERVICES_HERO),
  ]);
  const introP = pickPageContent(locale, intro);
  const kickerP = pickPageContent(locale, kicker);
  const u = ui(locale);

  return (
    <div className="editorial-section py-20 md:py-28 lg:py-32">
      <PageHeroIntro locale={locale} hero={pageHero} className="">
        <header className="max-w-3xl">
          {kickerP.title ? (
            <p className="text-[10px] uppercase tracking-[0.42em] text-muted">{kickerP.title}</p>
          ) : null}
          <h1 className="font-display mt-6 text-[clamp(2.25rem,5.5vw,3.75rem)] font-medium leading-[1.08] tracking-[-0.03em] md:mt-10">
            {introP.title}
          </h1>
          {introP.body ? (
            <p className="mt-8 max-w-2xl text-[0.9375rem] font-light leading-[1.85] text-ink-muted md:mt-12 md:text-lg md:leading-[1.9]">
              {introP.body}
            </p>
          ) : null}
        </header>
      </PageHeroIntro>

      <div className="mt-16 md:mt-24">
        {services.map((s, i) => (
          <PublicServiceCard
            key={s.id}
            locale={locale}
            service={s}
            index={i}
            title={serviceTitle(locale, s)}
            description={serviceDescription(locale, s)}
            bookLabel={u.serviceBookThis}
            viewLabel={u.serviceViewDetails}
            coverPlaceholderLabel={u.serviceCoverPlaceholder}
          />
        ))}
      </div>
    </div>
  );
}
