import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactForm } from "@/components/contact-form";
import { PageHeroIntro } from "@/components/page-hero-intro";
import { contactFormCopy, contactPageChromeCopy } from "@/lib/contact-messages";
import { resolveContactLinks } from "@/lib/contact-links";
import { getPageHeroMedia, getPageSectionMap, getPublishedServices, getSiteSettings } from "@/lib/data";
import { PageHeroPlacement } from "@prisma/client";
import { buildPageMetadata } from "@/lib/seo";
import { pickPageContent, pickTextWithOptionalFallback, serviceTitle } from "@/lib/locale";
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
  return buildPageMetadata({ locale, seoSection: "contact", path: `/${locale}/contact` });
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const { service: serviceFromQuery } = await searchParams;

  const [contact, site, services, pageHero] = await Promise.all([
    getPageSectionMap("contact"),
    getSiteSettings(),
    getPublishedServices(),
    getPageHeroMedia(PageHeroPlacement.CONTACT_HERO),
  ]);

  const pageTitle = pickPageContent(locale, contact["page_title"]).title;
  const note = pickPageContent(locale, contact["note"]);
  const directHeading = pickPageContent(locale, contact["direct"]).title;
  const formHeading = pickPageContent(locale, contact["form_heading"]).title;
  const waRow = contact["whatsapp_label"];
  const igRow = contact["instagram_label"];
  const waLabel =
    pickTextWithOptionalFallback(locale, waRow?.titleEn, waRow?.titleAr) ||
    (locale === "ar" ? "تواصل عبر واتساب" : "Message on WhatsApp");
  const igLabel =
    pickTextWithOptionalFallback(locale, igRow?.titleEn, igRow?.titleAr) ||
    (locale === "ar" ? "متابعة على إنستغرام" : "Follow on Instagram");
  const kicker = pickPageContent(locale, contact["page_kicker"]).title;

  const links = resolveContactLinks(site);
  const location = site?.footerLocationLine ?? "";
  const chrome = contactPageChromeCopy(locale);

  const serviceOptions = services.map((s) => ({
    value: s.slug,
    label: serviceTitle(locale, s),
  }));
  const defaultServiceSlug =
    serviceFromQuery && services.some((s) => s.slug === serviceFromQuery) ? serviceFromQuery : undefined;

  const copy = contactFormCopy(locale);

  return (
    <>
      <PageHeroIntro locale={locale} hero={pageHero} className="editorial-section pb-12 pt-20 sm:pb-16 sm:pt-24 md:pb-20 md:pt-36">
        <header className="max-w-[42rem]">
          {kicker ? (
            <p className="text-[10px] uppercase tracking-[0.42em] text-muted">{kicker}</p>
          ) : null}
          <h1 className="font-display mt-8 text-[clamp(2.25rem,6.5vw,3.75rem)] font-medium leading-[1.08] tracking-[-0.03em] md:mt-10">
            {pageTitle}
          </h1>
          {note.body ? (
            <p className="editorial-prose mt-10 max-w-xl text-base font-light leading-relaxed md:mt-12 md:text-lg">
              {note.body}
            </p>
          ) : null}
        </header>
      </PageHeroIntro>

      <div className="editorial-section grid gap-16 border-t border-line/50 pb-20 pt-12 md:grid-cols-12 md:gap-16 md:pb-36 md:pt-20 lg:gap-20">
        <div className="flex flex-col md:col-span-5">
          {directHeading ? (
            <p className="text-[10px] uppercase tracking-[0.34em] text-muted">{directHeading}</p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:mt-10">
            <a
              href={links.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[52px] w-full touch-manipulation items-center justify-center bg-ink-bright px-8 py-4 text-center text-[11px] font-medium uppercase tracking-[0.26em] text-paper transition-[opacity,transform] duration-300 hover:opacity-90 active:scale-[0.99] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink-bright/50 sm:min-h-[54px] sm:max-w-md sm:justify-center"
            >
              {waLabel}
            </a>
            <a
              href={links.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[48px] w-full touch-manipulation items-center justify-center border border-line/45 bg-transparent px-8 py-3.5 text-center text-[10px] uppercase tracking-[0.32em] text-ink-muted transition-colors duration-300 hover:border-ink-bright/30 hover:text-ink-bright focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink-bright/40 sm:max-w-md"
            >
              {igLabel}
            </a>
          </div>

          <div className="mt-12 border-t border-line/35 pt-10 md:mt-14 md:pt-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted">{chrome.detailsLabel}</p>
            <div className="mt-6 space-y-5 text-[15px] font-light leading-relaxed tracking-wide text-ink md:text-base">
              {links.email ? (
                <a
                  href={`mailto:${links.email}`}
                  className="block break-all underline-offset-4 transition-colors duration-300 hover:text-ink-bright hover:underline"
                >
                  {links.email}
                </a>
              ) : null}
              {links.phone ? (
                <a
                  href={links.telHref}
                  className="block tabular-nums transition-colors duration-300 hover:text-ink-bright"
                >
                  {links.phone}
                </a>
              ) : null}
              {location ? (
                <p className="max-w-sm text-sm leading-[1.75] text-muted">{location}</p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="md:col-span-7 md:border-s md:border-line/35 md:ps-12 lg:ps-16">
          {formHeading ? (
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted">{formHeading}</p>
          ) : null}
          <ContactForm
            locale={locale}
            serviceOptions={serviceOptions}
            copy={copy}
            defaultServiceSlug={defaultServiceSlug}
          />
        </div>
      </div>

      {links.mapEmbedUrl ? (
        <div className="editorial-section mt-20 border-t border-line/50 pt-20 md:mt-28 md:pt-28">
          <p className="text-[10px] uppercase tracking-[0.34em] text-muted">{chrome.mapSection}</p>
          <div className="relative mt-8 overflow-hidden border border-line/40 bg-paper md:mt-10">
            <div
              className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-paper/40 via-transparent to-paper/50"
              aria-hidden
            />
            <iframe
              src={links.mapEmbedUrl}
              className="aspect-[4/3] min-h-[220px] w-full contrast-[1.02] sm:min-h-[280px] md:aspect-[21/9] md:min-h-[300px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              title={chrome.mapIframeTitle}
            />
          </div>
          {links.mapPageUrl ? (
            <a
              href={links.mapPageUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex min-h-[44px] items-center text-[10px] uppercase tracking-[0.3em] text-muted transition-colors duration-300 hover:text-ink-bright focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink-bright/45"
            >
              {chrome.mapOpen}
            </a>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
