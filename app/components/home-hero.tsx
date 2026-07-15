import Image from "next/image";
import Link from "next/link";
import type { HeroSettings, Media, SiteSettings } from "@/lib/generated/prisma/browser";
import { MediaType } from "@/lib/generated/prisma/browser";
import { heroCopy } from "@/lib/locale";
import type { Locale } from "@/lib/locale";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";

type Props = {
  hero: (HeroSettings & { imageMedia: Media | null; videoMedia: Media | null }) | null;
  site: SiteSettings | null;
  locale: Locale;
};

/** Original framing — do not alter object-position, scale, or crop. */
const mediaClass = "h-full w-full scale-[1.015] object-cover object-center";

type CopyProps = {
  eyebrow: string;
  overlayTitle: string;
  overlaySubtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

function HeroCopyEnglish({ eyebrow, overlayTitle, overlaySubtitle, ctaLabel, ctaHref }: CopyProps) {
  return (
    <div className="home-hero-copyplate home-hero-copyplate--en absolute inset-x-0 bottom-0 z-10">
      <div className="mx-auto w-full max-w-7xl px-7 md:px-12 lg:px-16">
        <div className="grid grid-cols-12 gap-x-6">
          <div className="home-hero-en-rail col-span-12 md:col-span-4 md:col-start-1 lg:col-span-4 lg:col-start-1">
            <div dir="ltr" lang="en" className="home-hero-copy home-hero-copy--en">
              {eyebrow ? <p className="editorial-kicker">{eyebrow}</p> : null}
              <h1 className="home-hero-title font-display mt-6 md:mt-7">{overlayTitle}</h1>
              {overlaySubtitle ? <p className="hero-subline mt-6 md:mt-7">{overlaySubtitle}</p> : null}
              {ctaLabel ? (
                <div className="mt-9 md:mt-10">
                  <Link href={ctaHref} className="cta-editorial">
                    {ctaLabel}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCopyArabic({ eyebrow, overlayTitle, overlaySubtitle, ctaLabel, ctaHref }: CopyProps) {
  return (
    <div className="home-hero-copyplate home-hero-copyplate--ar absolute inset-x-0 bottom-0 z-10">
      <div className="mx-auto w-full max-w-7xl px-7 md:px-12 lg:px-16">
        <div className="grid grid-cols-12 gap-x-6">
          <div className="home-hero-ar-rail col-span-12 md:col-span-4 md:col-start-9 lg:col-span-4 lg:col-start-9">
            <div dir="rtl" lang="ar" className="home-hero-copy home-hero-copy--ar">
              {eyebrow ? <p className="editorial-kicker">{eyebrow}</p> : null}
              <h1 className="home-hero-title font-display mt-6 md:mt-7">{overlayTitle}</h1>
              {overlaySubtitle ? <p className="hero-subline mt-6 md:mt-7">{overlaySubtitle}</p> : null}
              {ctaLabel ? (
                <div className="mt-9 md:mt-10">
                  <Link href={ctaHref} className="cta-editorial">
                    {ctaLabel}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeHero({ hero, site, locale }: Props) {
  const copy = heroCopy(locale, hero, site);
  const isAr = locale === "ar";
  const imageAlt = isAr ? "لقطة من استوديو عُمان فوتو" : "Oman Photo studio photograph";

  const isVideo = hero?.mediaType === MediaType.VIDEO;
  const videoFromMedia = hero?.videoMedia ? resolveMediaSrc(hero.videoMedia).trim() : "";
  const videoFromUrl = hero?.videoUrl?.trim() || "";
  const videoSrc = isVideo ? videoFromMedia || videoFromUrl || null : null;
  const image = hero?.imageMedia ?? null;
  const imageSrc = image ? resolveMediaSrc(image) : null;

  return (
    <section className="home-hero relative min-h-[88vh] w-full overflow-hidden md:min-h-[92vh]">
      <div className="absolute inset-0 bg-paper">
        {isVideo && videoSrc ? (
          <video className={mediaClass} src={videoSrc} autoPlay muted loop playsInline />
        ) : imageSrc ? (
          <div className="relative h-full min-h-[88vh] w-full md:min-h-[92vh]">
            {isExternalUrl(imageSrc) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc} alt={imageAlt} className={mediaClass} />
            ) : (
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className={mediaClass}
                priority
                sizes="100vw"
                quality={90}
              />
            )}
          </div>
        ) : (
          <div className="h-full w-full bg-paper" />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/55 to-paper/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,transparent_0%,rgba(5,5,5,0.45)_55%,rgba(5,5,5,0.72)_100%)]" />

      {isAr ? <HeroCopyArabic {...copy} /> : <HeroCopyEnglish {...copy} />}
    </section>
  );
}
