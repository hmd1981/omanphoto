"use client";

import { MediaType, type Media } from "@prisma/client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MediaPlacementPicker, type MediaPickItem } from "@/components/admin/media-placement-picker";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";

export type ServiceMediaRow = {
  id: string;
  sortOrder: number;
  media: Pick<Media, "id" | "titleEn" | "titleAr" | "type" | "url" | "filePath">;
};

type Props = {
  serviceId: string;
  serviceTitleEn: string;
  initialRows: ServiceMediaRow[];
  allMedia: MediaPickItem[];
  onRefreshLibrary: () => Promise<void>;
  onSaved: () => Promise<void>;
};

function thumbSrc(m: ServiceMediaRow["media"]) {
  if (m.type !== MediaType.IMAGE) return null;
  const s = resolveMediaSrc(m).trim();
  return s || null;
}

export function ServiceMediaEditor({ serviceId, serviceTitleEn, initialRows, allMedia, onRefreshLibrary, onSaved }: Props) {
  const [ordered, setOrdered] = useState<ServiceMediaRow[]>(() => [...initialRows].sort((a, b) => a.sortOrder - b.sortOrder));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState(0);

  useEffect(() => {
    setOrdered([...initialRows].sort((a, b) => a.sortOrder - b.sortOrder));
  }, [serviceId, initialRows]);

  const orderedIds = useMemo(() => ordered.map((r) => r.media.id), [ordered]);

  const persist = useCallback(
    async (nextIds: string[]) => {
      setSaving(true);
      setMsg(null);
      const res = await fetch(`/api/admin/services/${serviceId}/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaIds: nextIds }),
      });
      setSaving(false);
      if (!res.ok) {
        setMsg("Could not save images.");
        return;
      }
      setMsg("Saved.");
      await onSaved();
    },
    [serviceId, onSaved],
  );

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= ordered.length) return;
    const next = [...ordered];
    const t = next[idx]!;
    next[idx] = next[j]!;
    next[j] = t;
    setOrdered(next);
    void persist(next.map((r) => r.media.id));
  };

  const removeAt = (idx: number) => {
    const next = ordered.filter((_, i) => i !== idx);
    setOrdered(next);
    void persist(next.map((r) => r.media.id));
  };

  const appendMedia = useCallback(
    async (mediaId: string | null) => {
      if (!mediaId) return;
      if (orderedIds.includes(mediaId)) {
        setMsg("That image is already in the list.");
        return;
      }
      const m = allMedia.find((x) => x.id === mediaId);
      if (!m || m.type !== MediaType.IMAGE) {
        setMsg("Choose an image from the library or upload.");
        return;
      }
      const nextIds = [...orderedIds, mediaId];
      await persist(nextIds);
      setPickerKey((k) => k + 1);
    },
    [allMedia, orderedIds, persist],
  );

  return (
    <div className="mt-0">
      <h3 className="text-[10px] uppercase tracking-[0.28em] text-muted">Service cover / service images</h3>
      <p className="mt-2 max-w-xl text-xs leading-relaxed text-neutral-500">
        Assign one or more images. The first image is used as the cover on the public services page. Reorder with ↑ / ↓.
        Remove with ×. Changes apply immediately.
      </p>

      <div className="mt-4 space-y-3">
        {ordered.map((row, idx) => {
          const src = thumbSrc(row.media);
          const isCover = idx === 0;
          return (
            <div
              key={row.media.id}
              className="flex flex-wrap items-center gap-3 border border-line/50 bg-black/30 px-3 py-3"
            >
              <div className="relative h-16 w-20 shrink-0 overflow-hidden border border-line/40 bg-surface">
                {src ? (
                  isExternalUrl(src) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Image src={src} alt="" fill className="object-cover" sizes="80px" />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[9px] text-muted">—</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-neutral-300">{row.media.titleEn}</p>
                {isCover ? (
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-amber-200/90">Cover image</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="border border-line px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-muted hover:border-white hover:text-white disabled:opacity-40"
                  disabled={saving || idx === 0}
                  onClick={() => move(idx, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="border border-line px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-muted hover:border-white hover:text-white disabled:opacity-40"
                  disabled={saving || idx === ordered.length - 1}
                  onClick={() => move(idx, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="border border-line px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-red-300/90 hover:border-red-400 hover:text-red-200 disabled:opacity-40"
                  disabled={saving}
                  onClick={() => removeAt(idx)}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted">Add image</p>
        <MediaPlacementPicker
          key={pickerKey}
          mode="image"
          mediaId={null}
          onMediaIdChange={(id) => void appendMedia(id)}
          allMedia={allMedia}
          onRefreshLibrary={onRefreshLibrary}
          placementTitle={`${serviceTitleEn} — service gallery`}
          uploadTitleSuffix={`Service · ${serviceTitleEn}`}
          usageLabelsExclude={[]}
        />
      </div>

      {msg ? <p className="mt-3 text-xs text-neutral-400">{msg}</p> : null}
    </div>
  );
}
