import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MediaType, type Media } from "@prisma/client";
import { getPublishedServiceBySlug } from "@/lib/data";
import { parseFaqBlocks } from "@/lib/faq";
import { localizedPath, mediaTitle, pickText, serviceDescription, serviceTitle, type Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";
import { ui } from "@/lib/ui-strings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) return {};
  const locale = raw as Locale;
  const service = await getPublishedServiceBySlug(slug);
  if (!service) return {};
  const title = `${pickText(locale, service.titleEn, service.titleAr)} — Oman Photo`;
  const desc = pickText(locale, service.descriptionEn, service.descriptionAr);
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const path = `/${locale}/services/${slug}`;
  const url = `${base}${path}`;
  const rest = path.replace(/^\/(en|ar)/, "");
  return {
    title,
    description: desc.slice(0, 220),
    alternates: {
      canonical: url,
      languages: { en: `${base}/en${rest}`, ar: `${base}/ar${rest}` },
    },
    openGraph: { title, description: desc.slice(0, 220), url, type: "website" },
  };
}

function firstHeroImageRow(service: { serviceMedia: { id: string; sortOrder: number; media: Media }[] }) {
  const ordered = [...service.serviceMedia].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    ordered.find(
      (r) => r.media.active && r.media.type === MediaType.IMAGE && resolveMediaSrc(r.media).trim(),
    ) ?? null
  );
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: raw, slug } = await params;
  if (!isLocale(raw)) notFound();
  const locale = raw as Locale;
  const service = await getPublishedServiceBySlug(slug);
  if (!service) notFound();

  const u = ui(locale);
  const title = serviceTitle(locale, service);
  const description = serviceDescription(locale, service);
  const extendedBody = pickText(locale, service.extendedBodyEn, service.extendedBodyAr);
  const faq = parseFaqBlocks(pickText(locale, service.faqEn, service.faqAr));
  const servicesHref = localizedPath(locale, "/services");
  const bookHref = `${localizedPath(locale, "/book")}?service=${encodeURIComponent(service.slug)}`;

  const ordered = [...service.serviceMedia].sort((a, b) => a.sortOrder - b.sortOrder);
  const heroRow = firstHeroImageRow(service);
  const galleryRows = heroRow ? ordered.filter((r) => r.id !== heroRow.id) : ordered;

  return (
    <div className="editorial-section py-16 md:py-24 lg:py-28">
      <nav className="text-[10px] uppercase tracking-[0.32em] text-muted">
        <Link href={servicesHref} className="hover:text-ink-bright hover:underline underline-offset-4">
          {u.serviceBreadcrumbParent}
        </Link>
        <span className="mx-3 text-line">/</span>
        <span className="text-ink-muted">{title}</span>
      </nav>

      {heroRow ? (
        <div className="relative mt-12 aspect-[21/11] w-full overflow-hidden border border-line/50 bg-surface md:mt-16 md:aspect-[21/9]">
          <HeroVisual media={heroRow.media} alt={title} />
        </div>
      ) : null}

      <header className={`max-w-3xl ${heroRow ? "mt-14 md:mt-20" : "mt-12 md:mt-16"}`}>
        <h1 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.03em]">
          {title}
        </h1>
        <p className="mt-8 text-[0.9375rem] font-light leading-[1.9] text-ink-muted md:mt-10 md:text-lg md:leading-[1.92]">
          {description}
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-8">
          <Link
            href={bookHref}
            className="inline-flex min-h-[44px] items-center text-[10px] uppercase tracking-[0.34em] text-ink-bright underline-offset-[0.35em] hover:underline"
          >
            {u.serviceBookThis}
          </Link>
          <Link
            href={servicesHref}
            className="inline-flex min-h-[44px] items-center text-[10px] uppercase tracking-[0.34em] text-muted underline-offset-[0.35em] hover:text-ink-bright hover:underline"
          >
            {u.serviceBackToAll}
          </Link>
        </div>
      </header>

      {extendedBody ? (
        <section className="mt-16 max-w-3xl border-t border-line/60 pt-14 md:mt-20 md:pt-16">
          <h2 className="text-[10px] uppercase tracking-[0.38em] text-muted">{u.serviceProcessHeading}</h2>
          <div className="mt-8 whitespace-pre-line text-sm font-light leading-[1.92] text-ink-muted md:text-[0.9375rem]">
            {extendedBody}
          </div>
        </section>
      ) : null}

      {faq.length > 0 ? (
        <section className="mt-16 max-w-3xl border-t border-line/60 pt-14 md:mt-20 md:pt-16">
          <h2 className="text-[10px] uppercase tracking-[0.38em] text-muted">{u.serviceFaqHeading}</h2>
          <dl className="mt-8 space-y-8">
            {faq.map((item, i) => (
              <div key={i}>
                <dt className="font-display text-base font-medium text-ink-bright md:text-lg">{item.question}</dt>
                <dd className="mt-3 text-sm font-light leading-[1.9] text-ink-muted">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {galleryRows.length > 0 ? (
        <section className="mt-20 border-t border-line/60 pt-16 md:mt-28 md:pt-20">
          <h2 className="text-[10px] uppercase tracking-[0.38em] text-muted">
            {u.serviceGalleryHeading}
          </h2>
          <div className="mt-10 columns-1 gap-7 sm:columns-2 lg:columns-3">
            {galleryRows.map((row, index) => (
              <figure
                key={row.id}
                className="mb-7 break-inside-avoid border border-line/60 bg-surface sm:mb-8"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-surface">
                  {row.media.type === MediaType.VIDEO ? (
                    <GalleryVideo media={row.media} title={mediaTitle(locale, row.media)} priority={index < 2} />
                  ) : (
                    <GalleryImage media={row.media} title={mediaTitle(locale, row.media)} priority={index < 2} />
                  )}
                </div>
                <figcaption className="border-t border-line/40 px-4 py-3 text-[11px] font-light text-ink-muted">
                  {mediaTitle(locale, row.media)}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function HeroVisual({ media, alt }: { media: Media; alt: string }) {
  const src = resolveMediaSrc(media).trim();
  if (!src) return <div className="h-full w-full bg-surface" />;
  if (isExternalUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="h-full w-full object-cover contrast-[1.02]" />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover contrast-[1.02]"
      sizes="100vw"
      priority
      quality={90}
    />
  );
}

function GalleryImage({ media, title, priority }: { media: Media; title: string; priority: boolean }) {
  const src = resolveMediaSrc(media).trim();
  if (!src) return <div className="h-full w-full bg-surface" aria-hidden />;
  if (isExternalUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={title} className="h-full w-full object-cover" />
    );
  }
  return (
    <Image
      src={src}
      alt={title}
      fill
      className="object-cover"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      loading={priority ? "eager" : "lazy"}
      priority={priority}
      quality={85}
    />
  );
}

function GalleryVideo({ media, title, priority }: { media: Media; title: string; priority: boolean }) {
  const src = resolveMediaSrc(media).trim();
  if (!src) return <div className="h-full w-full bg-surface" />;
  return (
    <video
      aria-label={title}
      className="h-full w-full object-cover"
      src={src}
      muted
      loop
      playsInline
      controls
      preload={priority ? "metadata" : "none"}
    />
  );
}
