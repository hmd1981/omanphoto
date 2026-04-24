"use client";

import { MediaType, PageHeroPlacement, type PageHeroMedia, type Media } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPreviewFrame } from "@/components/admin/admin-preview-frame";
import { MediaPlacementPicker } from "@/components/admin/media-placement-picker";
import { pageHeroUsageLine } from "@/lib/admin-media-usage-labels";
import { adminFetchErrorMessage, adminFetchJson } from "@/lib/admin-fetch";
import { resolvePageHeroVisual } from "@/lib/page-hero-visual";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";

type HeroRow = PageHeroMedia & { imageMedia: Media | null; videoMedia: Media | null };

type MediaLite = {
  id: string;
  titleEn: string;
  type: MediaType;
  url: string | null;
  filePath: string | null;
  usageLabels?: string[];
};

const PLACEMENTS: { placement: PageHeroPlacement; title: string; route: string }[] = [
  { placement: PageHeroPlacement.PORTFOLIO_HERO, title: "PORTFOLIO_HERO — Galleries", route: "/en/portfolio" },
  { placement: PageHeroPlacement.SERVICES_HERO, title: "SERVICES_HERO — Services", route: "/en/services" },
  { placement: PageHeroPlacement.ABOUT_HERO, title: "ABOUT_HERO — Studio (About)", route: "/en/about" },
  { placement: PageHeroPlacement.CONTACT_HERO, title: "CONTACT_HERO — Enquire (Contact)", route: "/en/contact" },
  { placement: PageHeroPlacement.AI_STUDIO_HERO, title: "AI_STUDIO_HERO — AI Studio", route: "/en/ai-studio" },
  { placement: PageHeroPlacement.BOOK_HERO, title: "BOOK_HERO — Book", route: "/en/book" },
];

function PreviewPanel({ hero }: { hero: HeroRow }) {
  const v = resolvePageHeroVisual(hero);
  if (!v) {
    return (
      <div className="border border-line/50 bg-neutral-950 px-6 py-16 text-center text-xs text-muted">
        No active media — public page shows text only.
      </div>
    );
  }
  if (v.mode === "video") {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden border border-line/40 bg-black">
        <video className="h-full w-full object-cover grayscale" src={v.src} muted loop playsInline autoPlay />
      </div>
    );
  }
  if (isExternalUrl(v.src)) {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden border border-line/40 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={v.src} alt="" className="h-full w-full object-cover grayscale" />
      </div>
    );
  }
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden border border-line/40 bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={v.src} alt="" className="h-full w-full object-cover grayscale" />
    </div>
  );
}

function PlacementCard({
  meta,
  hero,
  allMedia,
  onSaved,
  onRefreshMedia,
}: {
  meta: (typeof PLACEMENTS)[number];
  hero: HeroRow | undefined;
  allMedia: MediaLite[];
  onSaved: (h: HeroRow) => void;
  onRefreshMedia: () => Promise<void>;
}) {
  const [active, setActive] = useState(hero?.active ?? false);
  const [sortOrder, setSortOrder] = useState(hero?.sortOrder ?? 0);
  const [mediaType, setMediaType] = useState<MediaType>(hero?.mediaType ?? MediaType.IMAGE);
  const [imageMediaId, setImageMediaId] = useState<string | null>(hero?.imageMediaId ?? null);
  const [videoMediaId, setVideoMediaId] = useState<string | null>(hero?.videoMediaId ?? null);
  const [videoUrl, setVideoUrl] = useState(hero?.videoUrl ?? "");

  const handlePickImage = useCallback((id: string | null) => {
    setImageMediaId(id);
    if (id) setActive(true);
  }, []);
  const handlePickVideo = useCallback((id: string | null) => {
    setVideoMediaId(id);
    if (id) setActive(true);
  }, []);
  const handleExternalVideoUrl = useCallback((url: string) => {
    setVideoUrl(url);
    if (url.trim()) setActive(true);
  }, []);

  const hasMediaAssigned =
    (mediaType === MediaType.IMAGE && Boolean(imageMediaId)) ||
    (mediaType === MediaType.VIDEO && (Boolean(videoMediaId) || Boolean(videoUrl.trim())));
  const willBeHiddenOnPublicSite = hasMediaAssigned && !active;
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hero) return;
    setActive(hero.active);
    setSortOrder(hero.sortOrder);
    setMediaType(hero.mediaType);
    setImageMediaId(hero.imageMediaId);
    setVideoMediaId(hero.videoMediaId);
    setVideoUrl(hero.videoUrl ?? "");
  }, [hero]);

  const draft: HeroRow = useMemo(
    () =>
      ({
        id: hero?.id ?? "draft",
        placement: meta.placement,
        active,
        sortOrder,
        mediaType,
        imageMediaId,
        videoMediaId,
        videoUrl: videoUrl || null,
        updatedAt: hero?.updatedAt ?? new Date(),
        imageMedia: imageMediaId ? allMedia.find((m) => m.id === imageMediaId) ?? null : null,
        videoMedia: videoMediaId ? allMedia.find((m) => m.id === videoMediaId) ?? null : null,
      }) as HeroRow,
    [hero, meta.placement, active, sortOrder, mediaType, imageMediaId, videoMediaId, videoUrl, allMedia],
  );

  const thumbSrc = useMemo(() => {
    if (mediaType === MediaType.IMAGE && imageMediaId) {
      const m = allMedia.find((x) => x.id === imageMediaId);
      if (m?.type === MediaType.IMAGE) return resolveMediaSrc(m).trim() || null;
    }
    if (mediaType === MediaType.VIDEO && videoMediaId) {
      const m = allMedia.find((x) => x.id === videoMediaId);
      if (m?.type === MediaType.VIDEO) return resolveMediaSrc(m).trim() || null;
    }
    return null;
  }, [mediaType, imageMediaId, videoMediaId, allMedia]);

  const save = useCallback(async () => {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/page-hero-media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placement: meta.placement,
        active,
        sortOrder,
        mediaType,
        imageMediaId: mediaType === MediaType.IMAGE ? imageMediaId : null,
        videoMediaId: mediaType === MediaType.VIDEO ? videoMediaId : null,
        videoUrl: mediaType === MediaType.VIDEO ? videoUrl : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg("Could not save.");
      return;
    }
    const j = (await res.json()) as { item: HeroRow };
    onSaved(j.item);
    setMsg("Saved.");
  }, [meta.placement, active, sortOrder, mediaType, imageMediaId, videoMediaId, videoUrl, onSaved]);

  return (
    <section className="border border-line/60 bg-neutral-950/40 p-6 md:p-8">
      <div className="flex flex-col gap-2 border-b border-line/50 pb-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Placement</p>
        <h2 className="font-display text-xl tracking-[0.08em]">{meta.title}</h2>
        <p className="text-xs text-neutral-500">Public route: {meta.route} (and /ar/…)</p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-white" />
            <span>Active (show media on public page when assigned)</span>
          </label>
          {willBeHiddenOnPublicSite ? (
            <div className="border border-amber-700/60 bg-amber-950/20 px-4 py-3 text-xs text-amber-200">
              You assigned a {mediaType === MediaType.VIDEO ? "video" : "picture"} but <strong>Active is off</strong>.
              The public {meta.route} page will not show it. Tick <strong>Active</strong> above and Save.
            </div>
          ) : null}
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Sort order</span>
            <input
              type="number"
              min={0}
              max={999}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="mt-2 w-24 border border-line bg-black px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Media type</span>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as MediaType)}
              className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm"
            >
              <option value={MediaType.IMAGE}>Image</option>
              <option value={MediaType.VIDEO}>Video</option>
            </select>
          </label>
          {mediaType === MediaType.IMAGE ? (
            <MediaPlacementPicker
              mode="image"
              mediaId={imageMediaId}
              onMediaIdChange={handlePickImage}
              allMedia={allMedia}
              onRefreshLibrary={onRefreshMedia}
              placementTitle={`${meta.title} — background image`}
              uploadTitleSuffix={meta.title}
              usageLabelsExclude={[pageHeroUsageLine(meta.placement, "image")]}
            />
          ) : (
            <MediaPlacementPicker
              mode="video"
              mediaId={videoMediaId}
              externalVideoUrl={videoUrl}
              onMediaIdChange={handlePickVideo}
              onExternalVideoUrlChange={handleExternalVideoUrl}
              allMedia={allMedia}
              onRefreshLibrary={onRefreshMedia}
              placementTitle={`${meta.title} — background video`}
              uploadTitleSuffix={meta.title}
              videoExternalUsesHeroUrl
              usageLabelsExclude={[pageHeroUsageLine(meta.placement, "video")]}
            />
          )}
          <button
            type="submit"
            disabled={saving}
            className="border border-white px-8 py-3 text-xs uppercase tracking-[0.25em] hover:bg-white hover:text-black disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save placement"}
          </button>
          {msg ? <p className="text-sm text-neutral-400">{msg}</p> : null}
        </form>

        <div className="min-w-0 space-y-4">
          <div className="space-y-1 border border-line/50 bg-black/20 px-4 py-3 text-xs text-neutral-400">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted">Placement summary</p>
            <p>
              <span className="text-neutral-500">Route:</span> {meta.route} (mirrors <span className="text-neutral-500">/ar/…</span>)
            </p>
            <p>
              <span className="text-neutral-500">Media type:</span> {mediaType}
            </p>
            <p>
              <span className="text-neutral-500">Active on site:</span> {active ? "yes" : "no"}
            </p>
            <p>
              <span className="text-neutral-500">Thumb (quick):</span>{" "}
              {thumbSrc ? (
                <span className="text-neutral-300">assigned</span>
              ) : mediaType === MediaType.VIDEO && videoUrl.trim() ? (
                <span className="text-neutral-300">external video URL</span>
              ) : (
                <span className="text-amber-200/80">none — preview shows empty state</span>
              )}
            </p>
          </div>

          <AdminPreviewFrame placement={`Page hero · ${meta.title}`} detail="Top-of-page right column (approx.)">
            {(vp) => (
              <div className={vp === "mobile" ? "space-y-4" : "grid grid-cols-12 gap-4"}>
                <div
                  className={
                    vp === "mobile"
                      ? "space-y-2"
                      : "col-span-5 space-y-2 border border-line/30 border-dashed p-4 text-neutral-500"
                  }
                >
                  <p className="text-[9px] uppercase tracking-[0.3em]">Intro copy</p>
                  <p className="font-display text-lg text-white">Title</p>
                  <p className="text-xs leading-relaxed">Body preview placeholder.</p>
                </div>
                <div className={vp === "mobile" ? "" : "col-span-7"}>
                  <PreviewPanel hero={draft} />
                </div>
              </div>
            )}
          </AdminPreviewFrame>
        </div>
      </div>
    </section>
  );
}

export function PageHeroesManager() {
  const [items, setItems] = useState<HeroRow[]>([]);
  const [allMedia, setAllMedia] = useState<MediaLite[]>([]);
  const [supportedPlacements, setSupportedPlacements] = useState<PageHeroPlacement[]>(PLACEMENTS.map((x) => x.placement));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshMediaOnly = useCallback(async () => {
    const m = await adminFetchJson<{ items?: MediaLite[] }>("/api/admin/media");
    setAllMedia((m.items as MediaLite[]) ?? []);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
    const [h, m] = await Promise.all([
      adminFetchJson<{ items?: HeroRow[]; supportedPlacements?: PageHeroPlacement[] }>("/api/admin/page-hero-media"),
      adminFetchJson<{ items?: MediaLite[] }>("/api/admin/media"),
    ]);
    setItems((h.items as HeroRow[]) ?? []);
    setAllMedia((m.items as MediaLite[]) ?? []);
    setSupportedPlacements(
      Array.isArray(h.supportedPlacements) && h.supportedPlacements.length > 0
        ? h.supportedPlacements
        : PLACEMENTS.map((x) => x.placement),
    );
    } catch (error) {
      setLoadError(adminFetchErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const byPlacement = useMemo(() => new Map(items.map((x) => [x.placement, x])), [items]);
  const visiblePlacements = useMemo(
    () => PLACEMENTS.filter((meta) => supportedPlacements.includes(meta.placement)),
    [supportedPlacements],
  );

  const onSaved = useCallback((row: HeroRow) => {
    setItems((prev) => {
      const next = prev.filter((p) => p.placement !== row.placement);
      next.push(row);
      return next;
    });
    void refreshMediaOnly();
  }, [refreshMediaOnly]);

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (loadError) {
    return (
      <div className="mt-8 border border-red-900/70 bg-red-950/20 p-6">
        <p className="text-sm text-red-200">Could not load Page Heroes.</p>
        <p className="mt-2 text-xs text-neutral-400">{loadError}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-4 border border-white px-5 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <p className="max-w-2xl text-sm text-neutral-400">
        Assign image or video for each public page hero (top of page, right column on large screens). Set inactive or clear
        selection to hide the media panel. Arabic pages mirror layout automatically.
      </p>
      {visiblePlacements.map((meta) => (
        <PlacementCard
          key={meta.placement}
          meta={meta}
          hero={byPlacement.get(meta.placement)}
          allMedia={allMedia}
          onSaved={onSaved}
          onRefreshMedia={refreshMediaOnly}
        />
      ))}
    </div>
  );
}
