import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeroIntro } from "@/components/page-hero-intro";
import { getPageHeroMedia, getPageSectionMap, getPublishedServices } from "@/lib/data";
import { PageHeroPlacement } from "@prisma/client";
import { buildPageMetadata } from "@/lib/seo";
import { localizedPath, pickPageContent, pickTextWithOptionalFallback, serviceTitle } from "@/lib/locale";
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
  return buildPageMetadata({ locale, seoSection: "book", path: `/${locale}/book` });
}

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const { service: serviceSlug } = await searchParams;
  const u = ui(locale);

  const [services, sections, pageHero] = await Promise.all([
    getPublishedServices(),
    getPageSectionMap("book"),
    getPageHeroMedia(PageHeroPlacement.BOOK_HERO),
  ]);
  const matched = serviceSlug ? services.find((s) => s.slug === serviceSlug) : undefined;
  const contactHref = matched
    ? `${localizedPath(locale, "/contact")}?service=${encodeURIComponent(matched.slug)}`
    : localizedPath(locale, "/contact");

  const kickerRow = sections["page_kicker"];
  const titleRow = sections["hero_title"];
  const subtitleRow = sections["hero_subtitle"];
  const descriptionRow = sections["hero_description"];

  const kicker =
    pickTextWithOptionalFallback(locale, kickerRow?.titleEn, kickerRow?.titleAr) ||
    (locale === "ar" ? "الحجز" : "Book");
  const title =
    pickTextWithOptionalFallback(locale, titleRow?.titleEn, titleRow?.titleAr) ||
    (locale === "ar" ? "الحجز" : "Book");
  const subtitlePick = pickPageContent(locale, subtitleRow);
  const subtitle = subtitlePick.title || subtitlePick.body;
  const description =
    pickTextWithOptionalFallback(locale, descriptionRow?.bodyEn, descriptionRow?.bodyAr) ||
    (locale === "ar"
      ? "أرسل الطلب عبر نموذج التواصل، أو راسلنا مباشرة."
      : "Send a request through the contact form, or reach us directly.");

  const routeNote =
    locale === "ar"
      ? "صفحة book مخصصة لتجميع روابط الحجز والمتابعة."
      : "This book page routes enquiries into the main contact flow.";

  return (
    <div className="editorial-section py-20 md:py-28 lg:py-32">
      <PageHeroIntro locale={locale} hero={pageHero} className="">
        <article>
          <header className="max-w-[44rem]">
            {kicker ? (
              <p className="text-[10px] uppercase tracking-[0.42em] text-muted" data-route="book">
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
            {matched ? (
              <p className="mt-8 max-w-xl border border-line/50 bg-surface/60 px-5 py-4 text-[11px] uppercase tracking-[0.28em] text-muted">
                <span className="text-muted">{u.bookSelectedService}</span>
                <span className="mt-2 block font-display text-base normal-case tracking-normal text-ink-bright">
                  {serviceTitle(locale, matched)}
                </span>
              </p>
            ) : null}
          </header>

          <div className="mt-16 flex flex-col gap-4 border-t border-line/50 pt-12 md:mt-20 md:pt-16">
            <Link
              href={contactHref}
              className="inline-flex min-h-[52px] max-w-md items-center justify-center bg-ink-bright px-8 py-4 text-center text-[11px] font-medium uppercase tracking-[0.26em] text-paper transition-opacity hover:opacity-90"
            >
              {locale === "ar" ? "انتقل إلى التواصل" : "Go to contact"}
            </Link>
            <p className="max-w-xl text-sm font-light text-ink-muted">{routeNote}</p>
          </div>
        </article>
      </PageHeroIntro>
    </div>
  );
}
