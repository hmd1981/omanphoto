import Image from "next/image";
import type { Media } from "@/lib/generated/prisma/browser";
import { MediaType } from "@/lib/generated/prisma/browser";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";

type Props = {
  media: Media | null | undefined;
  title: string;
  /** Localized label for video placeholder */
  videoLabel?: string;
};

export function PortfolioCard({ media, title, videoLabel = "Video" }: Props) {
  if (!media) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface">
        <span className="text-xs uppercase tracking-[0.25em] text-muted">—</span>
      </div>
    );
  }
  if (media.type === MediaType.VIDEO) {
    const src = resolveMediaSrc(media);
    if (!src) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-surface">
          <span className="text-xs uppercase tracking-[0.25em] text-muted">{videoLabel}</span>
        </div>
      );
    }
    return (
      <video
        className="h-full w-full object-cover transition duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={title}
      />
    );
  }
  const src = resolveMediaSrc(media);
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-surface">
        <span className="sr-only">{title}</span>
      </div>
    );
  }
  if (isExternalUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={title}
        className="h-full w-full object-cover transition duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
      />
    );
  }
  return (
    <Image
      src={src}
      alt={title}
      fill
      className="object-cover transition duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
      sizes="(max-width: 768px) 100vw, 33vw"
    />
  );
}
