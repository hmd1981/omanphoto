"use client";

import Image from "next/image";
import type { Category, Media } from "@/lib/generated/prisma/browser";
import { MediaType } from "@/lib/generated/prisma/browser";
import { useEffect, useRef, useState } from "react";
import { categoryLabel, mediaTitle, type Locale } from "@/lib/locale";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";
import { ui } from "@/lib/ui-strings";

type Item = Media & { category: Category | null };

export function PortfolioMasonry({ items, locale }: { items: Item[]; locale: Locale }) {
  const emptyMsg = ui(locale).portfolioEmpty;

  if (items.length === 0) {
    return <p className="mt-20 text-sm font-light text-muted">{emptyMsg}</p>;
  }

  return (
    <div className="mt-16 columns-1 gap-x-7 sm:mt-20 sm:columns-2 lg:columns-3">
      {items.map((m, index) => (
        <LazyTile key={m.id} media={m} locale={locale} priority={index < 3} />
      ))}
    </div>
  );
}

function LazyTile({ media, locale, priority }: { media: Item; locale: Locale; priority: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(priority);
  const title = mediaTitle(locale, media);
  const cat = media.category ? categoryLabel(locale, media.category) : "";

  useEffect(() => {
    if (priority || !ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [priority]);

  return (
    <div ref={ref} className="mb-7 break-inside-avoid sm:mb-8">
      <figure className="group border border-line/60 bg-surface transition-[border-color] duration-500 hover:border-line">
        <div className="relative aspect-[3/4] overflow-hidden bg-surface">
          {visible ? (
            media.type === MediaType.VIDEO ? (
              <VideoTile media={media} title={title} priority={priority} />
            ) : (
              <ImageTile media={media} title={title} priority={priority} />
            )
          ) : (
            <div className="h-full w-full animate-pulse bg-surface" aria-hidden />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper/80 via-paper/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-95" />
          <div className="pointer-events-none absolute inset-0 bg-paper/0 transition-colors duration-500 group-hover:bg-paper/20" />
          <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 p-5 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="text-[11px] uppercase tracking-[0.3em] text-ink-bright">{title}</p>
            {cat ? <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-ink-muted">{cat}</p> : null}
          </figcaption>
        </div>
        <div className="flex items-start justify-between gap-4 border-t border-line/40 px-4 py-4 md:hidden">
          <span className="text-sm font-light tracking-wide text-ink">{title}</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted">{cat}</span>
        </div>
      </figure>
    </div>
  );
}

function ImageTile({ media, title, priority }: { media: Item; title: string; priority: boolean }) {
  const src = resolveMediaSrc(media);
  if (!src) {
    return <div className="h-full w-full bg-surface" />;
  }
  if (isExternalUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={title}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="h-full w-full object-cover transition duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
      />
    );
  }
  return (
    <Image
      src={src}
      alt={title}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover transition duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
      loading={priority ? "eager" : "lazy"}
      quality={85}
      priority={priority}
    />
  );
}

function VideoTile({ media, title, priority }: { media: Item; title: string; priority: boolean }) {
  const src = resolveMediaSrc(media);
  if (!src) {
    return <div className="h-full w-full bg-surface" />;
  }
  return (
    <video
      aria-label={title}
      className="h-full w-full object-cover transition duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
      src={src}
      muted
      loop
      playsInline
      preload={priority ? "metadata" : "none"}
      onMouseEnter={(e) => void e.currentTarget.play()}
      onMouseLeave={(e) => {
        e.currentTarget.pause();
        e.currentTarget.currentTime = 0;
      }}
    />
  );
}
