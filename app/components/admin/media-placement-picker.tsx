"use client";

import { MediaType } from "@prisma/client";
import { useCallback, useMemo, useState } from "react";
import { createMediaFromExternalUrl, uploadFileAndCreateMedia } from "@/lib/admin-media-client";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";

export type MediaPickItem = {
  id: string;
  titleEn: string;
  type: MediaType;
  url: string | null;
  filePath: string | null;
  usageLabels?: string[];
};

type SourceTab = "upload" | "library" | "external";

type Props = {
  mode: "image" | "video";
  /** Selected gallery media id */
  mediaId: string | null;
  /** Hero / page-hero: external video URL when not using gallery video */
  externalVideoUrl?: string;
  onMediaIdChange: (id: string | null) => void;
  /** Required when video uses URL-only mode (clears media id) */
  onExternalVideoUrlChange?: (url: string) => void;
  allMedia: MediaPickItem[];
  onRefreshLibrary: () => Promise<void>;
  /** Shown in labels, e.g. "Home hero — background" */
  placementTitle: string;
  /** Appended to auto titles for uploads, e.g. "Home hero" */
  uploadTitleSuffix: string;
  /** If true, external video tab sets URL string only (no Media row). If false, URL creates a Media with type VIDEO. */
  videoExternalUsesHeroUrl?: boolean;
  /** Hide these usage labels in “Also used for” (e.g. current placement’s own line). */
  usageLabelsExclude?: string[];
};

export function MediaPlacementPicker({
  mode,
  mediaId,
  externalVideoUrl = "",
  onMediaIdChange,
  onExternalVideoUrlChange,
  allMedia,
  onRefreshLibrary,
  placementTitle,
  uploadTitleSuffix,
  videoExternalUsesHeroUrl = true,
  usageLabelsExclude = [],
}: Props) {
  const [tab, setTab] = useState<SourceTab>("library");
  const [libraryFilter, setLibraryFilter] = useState("");
  const [externalUrlInput, setExternalUrlInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pool = useMemo(
    () => allMedia.filter((m) => (mode === "image" ? m.type === MediaType.IMAGE : m.type === MediaType.VIDEO)),
    [allMedia, mode],
  );

  const filteredPool = useMemo(() => {
    const q = libraryFilter.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((m) => m.titleEn.toLowerCase().includes(q) || m.id.toLowerCase().includes(q));
  }, [pool, libraryFilter]);

  const selected = useMemo(() => (mediaId ? allMedia.find((m) => m.id === mediaId) : undefined), [allMedia, mediaId]);

  const sourceSummary = useMemo(() => {
    if (mode === "video" && videoExternalUsesHeroUrl && externalVideoUrl.trim()) {
      return "External video URL (not stored as gallery item)";
    }
    if (!mediaId) return "None selected";
    const m = selected;
    if (!m) return "Library item";
    if (m.filePath) return "Uploaded file (gallery)";
    if (m.url) return isExternalUrl(m.url) ? "External URL (saved as gallery item)" : "URL";
    return "Gallery";
  }, [mode, videoExternalUsesHeroUrl, externalVideoUrl, mediaId, selected]);

  const usageLines = useMemo(() => {
    const raw = selected?.usageLabels ?? [];
    const ex = new Set(usageLabelsExclude);
    return raw.filter((l) => !ex.has(l));
  }, [selected?.usageLabels, usageLabelsExclude]);

  const handleUpload = useCallback(
    async (file: File | null) => {
      if (!file || file.size === 0) return;
      setError(null);
      setBusy(true);
      try {
        const title = `${uploadTitleSuffix} · ${mode === "image" ? "Image" : "Video"} · ${new Date().toISOString().slice(0, 10)}`;
        const item = await uploadFileAndCreateMedia(file, mode === "image" ? MediaType.IMAGE : MediaType.VIDEO, title);
        onMediaIdChange(item.id);
        if (mode === "video" && onExternalVideoUrlChange) onExternalVideoUrlChange("");
        await onRefreshLibrary();
        setTab("library");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [mode, onMediaIdChange, onExternalVideoUrlChange, onRefreshLibrary, uploadTitleSuffix],
  );

  const handleExternalSubmit = useCallback(async () => {
    const raw = externalUrlInput.trim();
    if (!raw) {
      setError("Enter a URL");
      return;
    }
    setError(null);
    if (mode === "video" && videoExternalUsesHeroUrl && onExternalVideoUrlChange) {
      onExternalVideoUrlChange(raw);
      onMediaIdChange(null);
      setExternalUrlInput("");
      return;
    }
    setBusy(true);
    try {
      const title = `${uploadTitleSuffix} · External · ${mode === "image" ? "Image" : "Video"}`;
      const item = await createMediaFromExternalUrl(
        raw,
        mode === "image" ? MediaType.IMAGE : MediaType.VIDEO,
        title,
      );
      onMediaIdChange(item.id);
      if (mode === "video" && onExternalVideoUrlChange) onExternalVideoUrlChange("");
      await onRefreshLibrary();
      setExternalUrlInput("");
      setTab("library");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }, [
    externalUrlInput,
    mode,
    onMediaIdChange,
    onExternalVideoUrlChange,
    onRefreshLibrary,
    uploadTitleSuffix,
    videoExternalUsesHeroUrl,
  ]);

  const clearAssignment = useCallback(() => {
    onMediaIdChange(null);
    if (mode === "video" && onExternalVideoUrlChange) onExternalVideoUrlChange("");
    setError(null);
  }, [mode, onMediaIdChange, onExternalVideoUrlChange]);

  const thumbSrc = selected ? resolveMediaSrc(selected).trim() : "";

  return (
    <div className="space-y-4 rounded border border-line/70 bg-black/30 p-4">
      <div className="flex flex-col gap-1 border-b border-line/40 pb-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-muted">{placementTitle}</p>
        <p className="text-xs text-neutral-500">Source: {sourceSummary}</p>
        {usageLines.length > 0 ? (
          <div className="mt-2 text-[11px] leading-relaxed text-neutral-500">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Also used for · </span>
            {usageLines.join(" · ")}
          </div>
        ) : selected ? (
          <p className="mt-1 text-[11px] text-neutral-600">No other placements reference this asset yet.</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2" role="tablist">
        {(["upload", "library", "external"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t);
              setError(null);
            }}
            className={`min-h-[44px] min-w-[100px] px-4 py-2.5 text-[10px] uppercase tracking-[0.22em] transition-colors ${
              tab === t ? "border border-white bg-white text-black" : "border border-line text-muted hover:border-white/40 hover:text-white"
            }`}
          >
            {t === "upload" ? "Upload" : t === "library" ? "Library" : mode === "video" && videoExternalUsesHeroUrl ? "Video URL" : "Link"}
          </button>
        ))}
      </div>

      {tab === "upload" && (
        <div className="space-y-3">
          <label className="flex min-h-[52px] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-line/80 bg-neutral-950/80 px-4 py-6 text-center transition-colors hover:border-white/30">
            <span className="text-xs uppercase tracking-[0.2em] text-white">
              {mode === "image" ? "Choose image file" : "Choose video file"}
            </span>
            <span className="text-[11px] text-neutral-500">JPG, PNG, WebP · MP4, WebM — from device</span>
            <input
              type="file"
              accept={mode === "image" ? "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" : "video/mp4,video/webm,.mp4,.webm"}
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                void handleUpload(f ?? null);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}

      {tab === "library" && (
        <div className="space-y-2">
          <input
            type="search"
            value={libraryFilter}
            onChange={(e) => setLibraryFilter(e.target.value)}
            placeholder="Filter by title…"
            className="min-h-[44px] w-full border border-line bg-black px-3 py-2.5 text-sm"
          />
          <select
            value={mediaId ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              onMediaIdChange(v);
              if (mode === "video" && onExternalVideoUrlChange) onExternalVideoUrlChange("");
            }}
            className="min-h-[48px] w-full border border-line bg-black px-3 py-2.5 text-sm"
          >
            <option value="">— None —</option>
            {filteredPool.map((m) => (
              <option key={m.id} value={m.id}>
                {m.titleEn}
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === "external" && (
        <div className="space-y-3">
          {mode === "video" && videoExternalUsesHeroUrl ? (
            <>
              <p className="text-xs text-neutral-500">
                Paste a direct link to a video file (MP4/WebM). This stores the URL on the placement only — not as a separate
                gallery row.
              </p>
              <input
                value={externalVideoUrl}
                onChange={(e) => {
                  onExternalVideoUrlChange?.(e.target.value);
                  onMediaIdChange(null);
                }}
                placeholder="https://…"
                className="min-h-[48px] w-full border border-line bg-black px-3 py-2.5 text-sm"
              />
            </>
          ) : (
            <>
              <p className="text-xs text-neutral-500">
                {mode === "image"
                  ? "Paste an image URL — a gallery item will be created and assigned."
                  : "Paste a video URL — a gallery item will be created and assigned."}
              </p>
              <input
                value={externalUrlInput}
                onChange={(e) => setExternalUrlInput(e.target.value)}
                placeholder="https://…"
                className="min-h-[48px] w-full border border-line bg-black px-3 py-2.5 text-sm"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleExternalSubmit()}
                className="min-h-[48px] w-full border border-white/90 px-4 py-3 text-[10px] uppercase tracking-[0.25em] hover:bg-white hover:text-black disabled:opacity-40"
              >
                Save URL as media & assign
              </button>
            </>
          )}
        </div>
      )}

      {selected && thumbSrc ? (
        <div className="flex gap-3 border-t border-line/40 pt-3">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden border border-line/60 bg-black">
            {selected.type === MediaType.VIDEO ? (
              <video className="h-full w-full object-cover" src={thumbSrc} muted playsInline preload="metadata" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbSrc} alt="" className="h-full w-full object-cover grayscale" />
            )}
          </div>
          <div className="min-w-0 text-[11px] text-neutral-400">
            <p className="truncate font-medium text-neutral-200">{selected.titleEn}</p>
            <p className="mt-1 text-neutral-600">{selected.filePath ? "Uploaded asset" : selected.url ? "Linked asset" : "—"}</p>
          </div>
        </div>
      ) : null}

      {mode === "video" && videoExternalUsesHeroUrl && externalVideoUrl.trim() ? (
        <p className="border-t border-line/40 pt-3 text-[11px] text-neutral-400">
          Active: external URL ({externalVideoUrl.slice(0, 48)}
          …)
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2 border-t border-line/40 pt-3">
        <button
          type="button"
          onClick={clearAssignment}
          className="min-h-[44px] border border-line px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted hover:border-white hover:text-white"
        >
          Remove assignment
        </button>
      </div>

      {error ? <p className="text-sm text-red-400/90">{error}</p> : null}
      {busy ? <p className="text-xs text-muted">Working…</p> : null}
    </div>
  );
}
