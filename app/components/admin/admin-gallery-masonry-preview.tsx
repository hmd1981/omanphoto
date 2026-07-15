"use client";

import type { Category } from "@/lib/generated/prisma/browser";
import type { Media } from "@/lib/generated/prisma/browser";
import { MediaType } from "@/lib/generated/prisma/browser";
import type { PreviewViewport } from "@/components/admin/admin-preview-frame";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";

type Item = Pick<Media, "id" | "type" | "filePath" | "url" | "titleEn" | "titleAr"> & {
  sortOrder: number;
  category: Pick<Category, "nameEn" | "nameAr"> | null;
};

type Props = {
  viewport: PreviewViewport;
  items: Item[];
  titleLabel?: string;
};

function Tile({ media, compact }: { media: Item; compact: boolean }) {
  const title = media.titleEn || media.titleAr || "Untitled";
  const cat = media.category?.nameEn ?? "";
  const src = resolveMediaSrc(media);

  return (
    <div className="mb-4 break-inside-avoid">
      <figure className="group border border-line/60 bg-surface">
        <div className={`relative overflow-hidden bg-surface ${compact ? "aspect-[3/4]" : "aspect-[3/4]"}`}>
          {!src ? (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">No media</div>
          ) : media.type === MediaType.VIDEO ? (
            <video
              key={src}
              className="h-full w-full object-cover"
              src={src}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
            />
          ) : isExternalUrl(src) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" className="h-full w-full object-cover" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper/80 via-transparent to-transparent opacity-70" />
          <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
            <p className="text-[10px] uppercase tracking-[0.25em] text-ink-bright">{title}</p>
            {cat ? <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-ink-muted">{cat}</p> : null}
          </figcaption>
        </div>
        {compact ? (
          <div className="flex items-start justify-between gap-2 px-3 py-2">
            <span className="line-clamp-2 text-xs text-ink">{title}</span>
          </div>
        ) : null}
      </figure>
    </div>
  );
}

export function AdminGalleryMasonryPreview({ viewport, items, titleLabel }: Props) {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.titleEn.localeCompare(b.titleEn));
  const colClass =
    viewport === "mobile" ? "columns-1 gap-x-4" : "columns-1 gap-x-4 sm:columns-2 lg:columns-3";

  return (
    <div className="bg-paper">
      {titleLabel ? (
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-muted">{titleLabel}</p>
      ) : null}
      {sorted.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">No media items yet.</p>
      ) : (
        <div className={colClass}>
          {sorted.map((m) => (
            <Tile key={m.id} media={m} compact={viewport === "mobile"} />
          ))}
        </div>
      )}
    </div>
  );
}
