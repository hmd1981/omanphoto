import Image from "next/image";
import Link from "next/link";
import type { HeroSettings, Media, SiteSettings } from "@prisma/client";
import { MediaType } from "@prisma/client";
import { heroCopy } from "@/lib/locale";
import type { Locale } from "@/lib/locale";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";

type Props = {
  hero: (HeroSettings & { imageMedia: Media | null; videoMedia: Media | null }) | null;
  site: SiteSettings | null;
  locale: Locale;
};

export function HomeHero({ hero, site, locale }: Props) {
  const { eyebrow, overlayTitle, overlaySubtitle, ctaLabel, ctaHref } = heroCopy(locale, hero, site);

  const isVideo = hero?.mediaType === MediaType.VIDEO;
  const videoFromMedia = hero?.videoMedia ? resolveMediaSrc(hero.videoMedia).trim() : "";
  const videoFromUrl = hero?.videoUrl?.trim() || "";
  const videoSrc = isVideo ? videoFromMedia || videoFromUrl || null : null;
  const image = hero?.imageMedia ?? null;
  const imageSrc = image ? resolveMediaSrc(image) : null;

  return (
    <section className="relative min-h-[88vh] w-full overflow-hidden md:min-h-[92vh]">
      <div className="absolute inset-0 bg-paper">
        {isVideo && videoSrc ? (
          <video className="h-full w-full scale-[1.015] object-cover" src={videoSrc} autoPlay muted loop playsInline />
        ) : imageSrc ? (
          <div className="relative h-full min-h-[88vh] w-full md:min-h-[92vh]">
            {isExternalUrl(imageSrc) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc} alt="" className="h-full w-full object-cover" />
            ) : (
              <Image
                src={imageSrc}
                alt=""
                fill
                className="object-cover"
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

      <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-end px-6 pb-24 pt-28 md:min-h-[92vh] md:px-10 md:pb-36 md:pt-40">
        {eyebrow ? (
          <p className="text-[10px] uppercase tracking-[0.48em] text-muted md:text-[11px]">{eyebrow}</p>
        ) : null}
        <h1 className="font-display mt-6 max-w-[16ch] text-[clamp(2.35rem,7.5vw,5.25rem)] font-medium leading-[1.0] tracking-[-0.03em] text-ink-bright md:mt-10 md:max-w-[18ch]">
          {overlayTitle}
        </h1>
        {overlaySubtitle ? (
          <p className="mt-8 max-w-[36ch] text-[0.9375rem] font-light leading-[1.75] text-ink-muted md:mt-12 md:max-w-xl md:text-lg md:leading-[1.8]">
            {overlaySubtitle}
          </p>
        ) : null}
        {ctaLabel ? (
          <div className="mt-12 md:mt-16">
            <Link
              href={ctaHref}
              className="group inline-flex items-center border border-ink-bright/50 bg-transparent px-9 py-3.5 text-[10px] uppercase tracking-[0.42em] text-ink-bright transition-[background-color,color] duration-500 hover:bg-ink-bright hover:text-paper focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink-bright/40"
            >
              <span className="relative">{ctaLabel}</span>
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
