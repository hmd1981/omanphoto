import type { Media } from "@prisma/client";

export function resolveMediaSrc(m: Pick<Media, "type" | "filePath" | "url">): string {
  if (m.filePath) {
    const name = m.filePath.replace(/^.*[/\\]/, "");
    return `/api/media/file/${encodeURIComponent(name)}`;
  }
  return m.url ?? "";
}

export function isExternalUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}
