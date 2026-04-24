"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPreviewFrame } from "@/components/admin/admin-preview-frame";
import { AdminServicesLivePreview } from "@/components/admin/admin-services-live-preview";
import type { MediaPickItem } from "@/components/admin/media-placement-picker";
import { ServiceMediaEditor, type ServiceMediaRow } from "@/components/admin/service-media-editor";

type Service = {
  id: string;
  titleEn: string;
  titleAr: string;
  slug: string;
  descriptionEn: string;
  descriptionAr: string;
  sortOrder: number;
  published: boolean;
  serviceMedia?: ServiceMediaRow[];
};

export function ServicesManager() {
  const [rows, setRows] = useState<Service[]>([]);
  const [newRow, setNewRow] = useState({
    titleEn: "",
    titleAr: "",
    slug: "",
    descriptionEn: "",
    descriptionAr: "",
    sortOrder: 0,
    published: true,
  });
  const [previewLocale, setPreviewLocale] = useState<"en" | "ar">("en");
  const [allMedia, setAllMedia] = useState<MediaPickItem[]>([]);

  const loadMediaLibrary = useCallback(async () => {
    const res = await fetch("/api/admin/media");
    const json = await res.json();
    setAllMedia((json.items ?? []) as MediaPickItem[]);
  }, []);

  async function reload() {
    const res = await fetch("/api/admin/services");
    const json = await res.json();
    setRows(json.items as Service[]);
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    void loadMediaLibrary();
  }, [loadMediaLibrary]);

  function patch(id: string, patch: Partial<Service>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
      <div className="min-w-0 space-y-8">
        <form
          className="space-y-4 border border-line p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/admin/services", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                titleEn: newRow.titleEn,
                titleAr: newRow.titleAr,
                slug: newRow.slug,
                descriptionEn: newRow.descriptionEn,
                descriptionAr: newRow.descriptionAr,
                sortOrder: newRow.sortOrder,
                published: newRow.published,
              }),
            });
            setNewRow({
              titleEn: "",
              titleAr: "",
              slug: "",
              descriptionEn: "",
              descriptionAr: "",
              sortOrder: 0,
              published: true,
            });
            await reload();
          }}
        >
          <h2 className="text-sm uppercase tracking-[0.25em] text-muted">New service</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Title (English)</span>
              <input
                value={newRow.titleEn}
                onChange={(e) => setNewRow((s) => ({ ...s, titleEn: e.target.value }))}
                required
                className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Title (Arabic)</span>
              <input
                value={newRow.titleAr}
                onChange={(e) => setNewRow((s) => ({ ...s, titleAr: e.target.value }))}
                required
                className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm"
                dir="rtl"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Slug</span>
              <input
                value={newRow.slug}
                onChange={(e) => setNewRow((s) => ({ ...s, slug: e.target.value }))}
                required
                className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Description (English)</span>
              <textarea
                value={newRow.descriptionEn}
                onChange={(e) => setNewRow((s) => ({ ...s, descriptionEn: e.target.value }))}
                required
                rows={4}
                className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Description (Arabic)</span>
              <textarea
                value={newRow.descriptionAr}
                onChange={(e) => setNewRow((s) => ({ ...s, descriptionAr: e.target.value }))}
                required
                rows={4}
                className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm"
                dir="rtl"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Sort</span>
              <input
                type="number"
                value={newRow.sortOrder}
                onChange={(e) => setNewRow((s) => ({ ...s, sortOrder: Number(e.target.value) }))}
                className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newRow.published}
                onChange={(e) => setNewRow((s) => ({ ...s, published: e.target.checked }))}
                className="h-4 w-4"
              />
              Published
            </label>
          </div>
          <button type="submit" className="mt-4 border border-white px-6 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black">
            Add service
          </button>
        </form>

        <div className="space-y-6">
          {rows.map((s) => (
            <form
              key={s.id}
              className="border border-line p-6"
              onSubmit={async (e) => {
                e.preventDefault();
                await fetch(`/api/admin/services/${s.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    titleEn: s.titleEn,
                    titleAr: s.titleAr,
                    slug: s.slug,
                    descriptionEn: s.descriptionEn,
                    descriptionAr: s.descriptionAr,
                    sortOrder: s.sortOrder,
                    published: s.published,
                  }),
                });
                await reload();
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-1">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Title (English)</span>
                  <input
                    value={s.titleEn}
                    onChange={(e) => patch(s.id, { titleEn: e.target.value })}
                    required
                    className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm"
                  />
                </label>
                <label className="block md:col-span-1">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Title (Arabic)</span>
                  <input
                    value={s.titleAr}
                    onChange={(e) => patch(s.id, { titleAr: e.target.value })}
                    required
                    className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm"
                    dir="rtl"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Slug</span>
                  <input
                    value={s.slug}
                    onChange={(e) => patch(s.id, { slug: e.target.value })}
                    required
                    className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Description (English)</span>
                  <textarea
                    value={s.descriptionEn}
                    onChange={(e) => patch(s.id, { descriptionEn: e.target.value })}
                    rows={4}
                    className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Description (Arabic)</span>
                  <textarea
                    value={s.descriptionAr}
                    onChange={(e) => patch(s.id, { descriptionAr: e.target.value })}
                    rows={4}
                    className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm"
                    dir="rtl"
                  />
                </label>
              </div>

              <div className="mt-8 border border-amber-900/40 bg-amber-950/15 px-4 py-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber-100/90">Photos · public services page</p>
                <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                  First image = cover on /en/services and /ar/services. Rest appear on the service detail page. Uses the same Media library as elsewhere.
                </p>
                <div className="mt-4">
                  <ServiceMediaEditor
                    serviceId={s.id}
                    serviceTitleEn={s.titleEn}
                    initialRows={s.serviceMedia ?? []}
                    allMedia={allMedia}
                    onRefreshLibrary={loadMediaLibrary}
                    onSaved={reload}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-end gap-6 border-t border-line/50 pt-6">
                <label className="block w-28">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">Sort</span>
                  <input
                    type="number"
                    value={s.sortOrder}
                    onChange={(e) => patch(s.id, { sortOrder: Number(e.target.value) })}
                    className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex items-center gap-2 pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={s.published}
                    onChange={(e) => patch(s.id, { published: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Published
                </label>
              </div>
              <div className="mt-4 flex gap-4">
                <button type="submit" className="border border-white px-6 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black">
                  Update
                </button>
                <button
                  type="button"
                  className="text-xs uppercase tracking-[0.2em] text-muted hover:text-white"
                  onClick={async () => {
                    if (!confirm("Delete service?")) return;
                    await fetch(`/api/admin/services/${s.id}`, { method: "DELETE" });
                    await reload();
                  }}
                >
                  Delete
                </button>
              </div>
            </form>
          ))}
        </div>
      </div>

      <div className="min-w-0 lg:sticky lg:top-6">
        <AdminPreviewFrame
          placement="Site · Services page — body sections"
          detail="Public routes: /en/services and /ar/services (intro headline comes from Page text → services)"
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
              <AdminServicesLivePreview viewport={viewport} services={rows} locale={previewLocale} />
            </div>
          )}
        </AdminPreviewFrame>
      </div>
    </div>
  );
}
