import Image from "next/image";
import Link from "next/link";
import type { Media, Service } from "@/lib/generated/prisma/browser";
import { MediaType } from "@/lib/generated/prisma/browser";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";
import { localizedPath } from "@/lib/locale";
import type { Locale } from "@/lib/locale";

export type ServiceWithGallery = Service & {
  serviceMedia: { sortOrder: number; media: Media }[];
};

type Props = {
  locale: Locale;
  service: ServiceWithGallery;
  index: number;
  title: string;
  description: string;
  bookLabel: string;
  viewLabel: string;
  coverPlaceholderLabel: string;
};

function coverMedia(service: ServiceWithGallery): Media | null {
  const rows = [...(service.serviceMedia ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const row of rows) {
    const m = row.media;
    if (!m.active) continue;
    if (m.type !== MediaType.IMAGE) continue;
    const src = resolveMediaSrc(m).trim();
    if (src) return m;
  }
  return null;
}

export function PublicServiceCard({
  locale,
  service,
  index,
  title,
  description,
  bookLabel,
  viewLabel,
  coverPlaceholderLabel,
}: Props) {
  const media = coverMedia(service);
  const detailHref = localizedPath(locale, `/services/${service.slug}`);
  const bookHref = `${localizedPath(locale, "/book")}?service=${encodeURIComponent(service.slug)}`;
  const idxLabel = String(index + 1).padStart(2, "0");

  return (
    <article className="group border-t border-line/70 py-14 md:py-20 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14 lg:items-stretch">
        <div className="lg:col-span-5">
          <div className="relative aspect-[4/5] w-full overflow-hidden border border-line/45 bg-surface sm:aspect-[5/6] md:aspect-[4/3] lg:aspect-[4/5]">
            {media ? (
              <ServiceCoverVisual media={media} alt={title} />
            ) : (
              <div
                className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-surface to-paper px-6 text-center"
                aria-hidden
              >
                <span className="font-display text-2xl text-muted/40 md:text-3xl">○</span>
                <p className="max-w-[14rem] text-[10px] uppercase tracking-[0.35em] text-muted">{coverPlaceholderLabel}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center lg:col-span-7">
          <p className="font-display text-xl text-muted-soft md:text-2xl">{idxLabel}</p>
          <h2 className="font-display mt-5 text-[clamp(1.65rem,3.2vw,2.45rem)] font-medium leading-[1.12] tracking-[-0.02em] md:mt-8">
            {title}
          </h2>
          <p className="mt-6 max-w-2xl text-[0.9375rem] font-light leading-[1.88] text-ink-muted md:mt-8 md:text-lg md:leading-[1.92]">
            {description}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8">
            <Link
              href={detailHref}
              className="inline-flex min-h-[44px] items-center text-[10px] uppercase tracking-[0.34em] text-ink-bright underline-offset-[0.35em] transition-colors duration-300 hover:text-ink-bright hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink-bright/40"
            >
              {viewLabel}
            </Link>
            <Link
              href={bookHref}
              className="inline-flex min-h-[44px] items-center text-[10px] uppercase tracking-[0.34em] text-ink-bright/85 underline-offset-[0.35em] transition-colors duration-300 hover:text-ink-bright hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink-bright/40"
            >
              {bookLabel}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function ServiceCoverVisual({ media, alt }: { media: Media; alt: string }) {
  const src = resolveMediaSrc(media).trim();
  if (!src) {
    return <div className="h-full w-full bg-surface" aria-hidden />;
  }
  if (isExternalUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="h-full w-full object-cover contrast-[1.02] transition duration-[900ms] ease-out group-hover:scale-[1.02]" />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover contrast-[1.02] transition duration-[900ms] ease-out group-hover:scale-[1.02]"
      sizes="(min-width: 1024px) 38vw, 100vw"
      quality={88}
    />
  );
}
