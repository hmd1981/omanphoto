import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeroIntro } from "@/components/page-hero-intro";
import { getPageHeroMedia, getPageSection, getPublishedServices } from "@/lib/data";
import { PageHeroPlacement } from "@prisma/client";
import { buildPageMetadata } from "@/lib/seo";
import { localizedPath, pickPageContent, serviceDescription, serviceTitle } from "@/lib/locale";
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

      <div className="mt-20 space-y-0 md:mt-28">
        {services.map((s, i) => (
          <section
            key={s.id}
            className="grid gap-10 border-t border-line/70 py-16 md:grid-cols-12 md:gap-16 md:py-24 lg:py-28"
          >
            <div className="md:col-span-4">
              <p className="font-display text-xl text-muted-soft md:text-2xl">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="font-display mt-6 text-[clamp(1.65rem,3.5vw,2.35rem)] font-medium leading-[1.15] tracking-[-0.02em] md:mt-10">
                {serviceTitle(locale, s)}
              </h2>
            </div>
            <div className="md:col-span-8 md:pt-2">
              <p className="text-[0.9375rem] font-light leading-[1.88] text-ink-muted md:text-lg md:leading-[1.92]">
                {serviceDescription(locale, s)}
              </p>
              <p className="mt-10">
                <Link
                  href={`${localizedPath(locale, "/book")}?service=${encodeURIComponent(s.slug)}`}
                  className="inline-flex min-h-[44px] items-center text-[10px] uppercase tracking-[0.34em] text-ink-bright/85 underline-offset-[0.35em] transition-colors duration-300 hover:text-ink-bright hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink-bright/40"
                >
                  {u.serviceBookThis}
                </Link>
              </p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
