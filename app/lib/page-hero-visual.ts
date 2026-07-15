import { MediaType, type Media } from "@/lib/generated/prisma/browser";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";

export type PageHeroVisual =
  | { mode: "image"; src: string }
  | { mode: "video"; src: string };

/** Resolve image or video source for a page hero row (home hero rules: gallery file or external video URL). */
export function resolvePageHeroVisual(hero: {
  active: boolean;
  mediaType: MediaType;
  imageMedia: Pick<Media, "type" | "filePath" | "url"> | null;
  videoMedia: Pick<Media, "type" | "filePath" | "url"> | null;
  videoUrl: string | null;
}): PageHeroVisual | null {
  if (!hero.active) return null;
  if (hero.mediaType === MediaType.IMAGE) {
    const img = hero.imageMedia;
    if (img?.type === MediaType.IMAGE) {
      const s = resolveMediaSrc(img).trim();
      if (s) return { mode: "image", src: s };
    }
    return null;
  }
  const vid = hero.videoMedia;
  const fromMedia = vid && vid.type === MediaType.VIDEO ? resolveMediaSrc(vid).trim() : "";
  const fromUrl = hero.videoUrl?.trim() ?? "";
  const s = fromMedia || fromUrl;
  if (s) return { mode: "video", src: s };
  return null;
}

export { isExternalUrl };
