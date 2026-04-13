import { MediaType } from "@prisma/client";

export type CreatedMediaItem = {
  id: string;
  titleEn: string;
  titleAr: string;
  type: MediaType;
  url: string | null;
  filePath: string | null;
};

/** Upload file to disk, create Media row, return item (for placement assignment). */
export async function uploadFileAndCreateMedia(
  file: File,
  type: MediaType,
  title: string,
): Promise<CreatedMediaItem> {
  const fd = new FormData();
  fd.append("file", file);
  const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!up.ok) {
    const j = (await up.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? "Upload failed");
  }
  const { filePath } = (await up.json()) as { filePath: string };
  const cr = await fetch("/api/admin/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      type,
      filePath,
    }),
  });
  if (!cr.ok) {
    throw new Error("Could not create media record");
  }
  const json = (await cr.json()) as { item: CreatedMediaItem };
  return json.item;
}

/** Create Media from external URL (image or hosted video file URL). */
export async function createMediaFromExternalUrl(
  url: string,
  type: MediaType,
  title: string,
): Promise<CreatedMediaItem> {
  const cr = await fetch("/api/admin/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      type,
      url: url.trim(),
    }),
  });
  if (!cr.ok) {
    throw new Error("Could not save URL as media");
  }
  const json = (await cr.json()) as { item: CreatedMediaItem };
  return json.item;
}
