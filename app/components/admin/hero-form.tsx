"use client";

import { MediaType } from "@/lib/generated/prisma/browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminHeroLivePreview } from "@/components/admin/admin-hero-live-preview";
import { AdminPreviewFrame } from "@/components/admin/admin-preview-frame";
import { MediaPlacementPicker } from "@/components/admin/media-placement-picker";
import { HOME_HERO_IMAGE_USAGE, HOME_HERO_VIDEO_USAGE } from "@/lib/admin-media-usage-labels";
import { adminFetchErrorMessage, adminFetchJson } from "@/lib/admin-fetch";
import { resolveMediaSrc } from "@/lib/media-url";

type Hero = {
  id: string;
  mediaType: MediaType;
  imageMediaId: string | null;
  videoMediaId: string | null;
  videoUrl: string | null;
  eyebrowEn: string | null;
  eyebrowAr: string | null;
  overlayTitleEn: string | null;
  overlayTitleAr: string | null;
  overlaySubtitleEn: string | null;
  overlaySubtitleAr: string | null;
  ctaLabelEn: string | null;
  ctaLabelAr: string | null;
  ctaHref: string | null;
};

type MediaLite = {
  id: string;
  titleEn: string;
  type: MediaType;
  url: string | null;
  filePath: string | null;
  usageLabels?: string[];
};

function resolveHeroVisuals(
  draft: {
    mediaType: MediaType;
    imageMediaId: string | null;
    videoMediaId: string | null;
    videoUrl: string;
  },
  byId: Map<string, MediaLite>,
): { imageSrc: string | null; videoSrc: string | null } {
  if (draft.mediaType === MediaType.IMAGE) {
    const img = draft.imageMediaId ? byId.get(draft.imageMediaId) : undefined;
    if (img && img.type === MediaType.IMAGE) {
      const s = resolveMediaSrc(img).trim();
      return { imageSrc: s || null, videoSrc: null };
    }
    return { imageSrc: null, videoSrc: null };
  }
  const vid = draft.videoMediaId ? byId.get(draft.videoMediaId) : undefined;
  const fromMedia = vid && vid.type === MediaType.VIDEO ? resolveMediaSrc(vid).trim() : "";
  const fromUrl = draft.videoUrl.trim();
  const videoSrc = fromMedia || fromUrl || null;
  return { imageSrc: null, videoSrc };
}

const inputCls = "mt-2 w-full border border-line bg-black px-4 py-3 text-sm";

export function HeroForm() {
  const [allMedia, setAllMedia] = useState<MediaLite[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [mediaType, setMediaType] = useState<MediaType>(MediaType.IMAGE);
  const [imageMediaId, setImageMediaId] = useState<string | null>(null);
  const [videoMediaId, setVideoMediaId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [eyebrowEn, setEyebrowEn] = useState("");
  const [eyebrowAr, setEyebrowAr] = useState("");
  const [overlayTitleEn, setOverlayTitleEn] = useState("");
  const [overlayTitleAr, setOverlayTitleAr] = useState("");
  const [overlaySubtitleEn, setOverlaySubtitleEn] = useState("");
  const [overlaySubtitleAr, setOverlaySubtitleAr] = useState("");
  const [ctaLabelEn, setCtaLabelEn] = useState("");
  const [ctaLabelAr, setCtaLabelAr] = useState("");
  const [ctaHref, setCtaHref] = useState("");

  const [previewLocale, setPreviewLocale] = useState<"en" | "ar">("en");
  const [loading, setLoading] = useState(true);

  const refreshLibrary = useCallback(async () => {
    const m = await adminFetchJson<{ items?: MediaLite[] }>("/api/admin/media");
    setAllMedia(((m.items as MediaLite[]) ?? []) as MediaLite[]);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [h, m] = await Promise.all([
        adminFetchJson<{ hero?: Hero | null }>("/api/admin/hero"),
        adminFetchJson<{ items?: MediaLite[] }>("/api/admin/media"),
      ]);
      const items = (m.items as MediaLite[]) ?? [];
      setAllMedia(items);
      const hero = (h.hero ?? null) as Hero | null;
      if (hero) {
        setMediaType(hero.mediaType);
        setImageMediaId(hero.imageMediaId);
        setVideoMediaId(hero.videoMediaId);
        setVideoUrl(hero.videoUrl ?? "");
        setEyebrowEn(hero.eyebrowEn ?? "");
        setEyebrowAr(hero.eyebrowAr ?? "");
        setOverlayTitleEn(hero.overlayTitleEn ?? "");
        setOverlayTitleAr(hero.overlayTitleAr ?? "");
        setOverlaySubtitleEn(hero.overlaySubtitleEn ?? "");
        setOverlaySubtitleAr(hero.overlaySubtitleAr ?? "");
        setCtaLabelEn(hero.ctaLabelEn ?? "");
        setCtaLabelAr(hero.ctaLabelAr ?? "");
        setCtaHref(hero.ctaHref ?? "");
      } else {
        setOverlayTitleEn("Masterpiece is crafted with intent.");
        setOverlayTitleAr("مو أي تصوير… هذا شغل يُصنع بذوق.");
      }
    } catch (error) {
      setLoadError(adminFetchErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byId = useMemo(() => new Map(allMedia.map((x) => [x.id, x])), [allMedia]);

  const { imageSrc, videoSrc } = useMemo(
    () =>
      resolveHeroVisuals(
        { mediaType, imageMediaId, videoMediaId, videoUrl },
        byId,
      ),
    [mediaType, imageMediaId, videoMediaId, videoUrl, byId],
  );

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (loadError) {
    return (
      <div className="mt-8 border border-red-900/70 bg-red-950/20 p-6">
        <p className="text-sm text-red-200">Could not load Homepage Hero editor.</p>
        <p className="mt-2 text-xs text-neutral-400">{loadError}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 border border-white px-5 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black"
        >
          Retry
        </button>
      </div>
    );
  }

  const previewEyebrow = previewLocale === "ar" ? eyebrowAr || eyebrowEn : eyebrowEn;
  const previewTitle = previewLocale === "ar" ? overlayTitleAr || overlayTitleEn : overlayTitleEn;
  const previewSubtitle = previewLocale === "ar" ? overlaySubtitleAr || overlaySubtitleEn : overlaySubtitleEn;
  const previewCta = previewLocale === "ar" ? ctaLabelAr || ctaLabelEn : ctaLabelEn;

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
      <div className="min-w-0 space-y-6">
        <form
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setMessage(null);
            const res = await fetch("/api/admin/hero", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mediaType,
                imageMediaId: mediaType === MediaType.IMAGE ? imageMediaId : null,
                videoMediaId: mediaType === MediaType.VIDEO ? videoMediaId : null,
                videoUrl: mediaType === MediaType.VIDEO ? videoUrl.trim() || null : null,
                eyebrowEn: eyebrowEn.trim() || null,
                eyebrowAr: eyebrowAr.trim() || null,
                overlayTitleEn,
                overlayTitleAr,
                overlaySubtitleEn,
                overlaySubtitleAr,
                ctaLabelEn,
                ctaLabelAr,
                ctaHref: ctaHref.trim() || null,
              }),
            });
            if (!res.ok) {
              setMessage("Could not save hero.");
              return;
            }
            const json = await res.json();
            const hero = json.hero as Hero;
            setMediaType(hero.mediaType);
            setImageMediaId(hero.imageMediaId);
            setVideoMediaId(hero.videoMediaId);
            setVideoUrl(hero.videoUrl ?? "");
            setEyebrowEn(hero.eyebrowEn ?? "");
            setEyebrowAr(hero.eyebrowAr ?? "");
            setOverlayTitleEn(hero.overlayTitleEn ?? "");
            setOverlayTitleAr(hero.overlayTitleAr ?? "");
            setOverlaySubtitleEn(hero.overlaySubtitleEn ?? "");
            setOverlaySubtitleAr(hero.overlaySubtitleAr ?? "");
            setCtaLabelEn(hero.ctaLabelEn ?? "");
            setCtaLabelAr(hero.ctaLabelAr ?? "");
            setCtaHref(hero.ctaHref ?? "");
            setMessage("Saved.");
            await refreshLibrary();
          }}
        >
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Hero background</span>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as MediaType)}
              className={inputCls}
            >
              <option value={MediaType.IMAGE}>Image</option>
              <option value={MediaType.VIDEO}>Video (library file or URL)</option>
            </select>
            <p className="mt-2 text-xs text-muted">
              Placement: Site home hero · Public routes <code className="text-ink-muted">/en</code>, <code className="text-ink-muted">/ar</code> (first viewport)
            </p>
          </label>
          {mediaType === MediaType.IMAGE ? (
            <MediaPlacementPicker
              mode="image"
              mediaId={imageMediaId}
              onMediaIdChange={setImageMediaId}
              allMedia={allMedia}
              onRefreshLibrary={refreshLibrary}
              placementTitle="Home hero — background image"
              uploadTitleSuffix="Home hero"
              usageLabelsExclude={[HOME_HERO_IMAGE_USAGE]}
            />
          ) : (
            <MediaPlacementPicker
              mode="video"
              mediaId={videoMediaId}
              externalVideoUrl={videoUrl}
              onMediaIdChange={setVideoMediaId}
              onExternalVideoUrlChange={setVideoUrl}
              allMedia={allMedia}
              onRefreshLibrary={refreshLibrary}
              placementTitle="Home hero — background video"
              uploadTitleSuffix="Home hero"
              videoExternalUsesHeroUrl
              usageLabelsExclude={[HOME_HERO_VIDEO_USAGE]}
            />
          )}

          <fieldset className="space-y-4 border border-line/40 px-5 py-5">
            <legend className="text-xs uppercase tracking-[0.25em] text-muted">Eyebrow (small line above title)</legend>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">English</span>
              <input value={eyebrowEn} onChange={(e) => setEyebrowEn(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">العربية</span>
              <input value={eyebrowAr} onChange={(e) => setEyebrowAr(e.target.value)} className={inputCls} dir="rtl" />
            </label>
          </fieldset>

          <fieldset className="space-y-4 border border-line/40 px-5 py-5">
            <legend className="text-xs uppercase tracking-[0.25em] text-muted">Overlay title</legend>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">English</span>
              <input value={overlayTitleEn} onChange={(e) => setOverlayTitleEn(e.target.value)} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">العربية</span>
              <input value={overlayTitleAr} onChange={(e) => setOverlayTitleAr(e.target.value)} className={inputCls} dir="rtl" />
            </label>
          </fieldset>

          <fieldset className="space-y-4 border border-line/40 px-5 py-5">
            <legend className="text-xs uppercase tracking-[0.25em] text-muted">Overlay subtitle</legend>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">English</span>
              <textarea value={overlaySubtitleEn} onChange={(e) => setOverlaySubtitleEn(e.target.value)} rows={3} className={inputCls} />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">العربية</span>
              <textarea value={overlaySubtitleAr} onChange={(e) => setOverlaySubtitleAr(e.target.value)} rows={3} className={inputCls} dir="rtl" />
            </label>
          </fieldset>

          <fieldset className="space-y-4 border border-line/40 px-5 py-5">
            <legend className="text-xs uppercase tracking-[0.25em] text-muted">CTA button</legend>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Label — English</span>
                <input value={ctaLabelEn} onChange={(e) => setCtaLabelEn(e.target.value)} className={inputCls} />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Label — العربية</span>
                <input value={ctaLabelAr} onChange={(e) => setCtaLabelAr(e.target.value)} className={inputCls} dir="rtl" />
              </label>
            </div>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Link href (both languages)</span>
              <input value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} className={inputCls} />
            </label>
          </fieldset>

          <button type="submit" className="border border-white px-8 py-3 text-xs uppercase tracking-[0.25em] hover:bg-white hover:text-black">
            Save hero
          </button>
          {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
        </form>
      </div>

      <div className="lg:sticky lg:top-6">
        <AdminPreviewFrame
          placement="Site · Home — hero section"
          detail="Public routes: /en and /ar (first viewport section)"
        >
          {(viewport) => (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted">Preview language</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewLocale("en")}
                    className={`border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                      previewLocale === "en" ? "border-white bg-white text-black" : "border-line text-muted hover:text-white"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewLocale("ar")}
                    className={`border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                      previewLocale === "ar" ? "border-white bg-white text-black" : "border-line text-muted hover:text-white"
                    }`}
                  >
                    AR
                  </button>
                </div>
              </div>
              <AdminHeroLivePreview
                viewport={viewport}
                mediaType={mediaType}
                imageSrc={imageSrc}
                videoSrc={videoSrc}
                eyebrow={previewEyebrow}
                overlayTitle={previewTitle}
                overlaySubtitle={previewSubtitle}
                ctaLabel={previewCta}
                ctaHref={ctaHref}
                rtl={previewLocale === "ar"}
              />
            </div>
          )}
        </AdminPreviewFrame>
      </div>
    </div>
  );
}
