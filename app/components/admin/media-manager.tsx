"use client";

import { MediaType } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminGalleryMasonryPreview } from "@/components/admin/admin-gallery-masonry-preview";
import { AdminPreviewFrame } from "@/components/admin/admin-preview-frame";
import { adminFetchErrorMessage, adminFetchJson } from "@/lib/admin-fetch";
import { isExternalUrl, resolveMediaSrc } from "@/lib/media-url";

type Category = { id: string; nameEn: string; nameAr: string };
type MediaRow = {
  id: string;
  titleEn: string;
  titleAr: string;
  type: MediaType;
  url: string | null;
  filePath: string | null;
  categoryId: string | null;
  sortOrder: number;
  active: boolean;
  featured: boolean;
  category: Category | null;
  usageLabels: string[];
};

function MediaPreview({ m }: { m: Pick<MediaRow, "type" | "url" | "filePath"> }) {
  const src = resolveMediaSrc(m);
  if (!src) {
    return <div className="h-16 w-24 bg-neutral-900 text-[10px] text-muted">No src</div>;
  }
  if (m.type === MediaType.VIDEO) {
    return (
      <video
        className="h-16 w-24 object-cover"
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
      />
    );
  }
  if (isExternalUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="h-16 w-24 object-cover" />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-16 w-24 object-cover" />
  );
}

export function MediaManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MediaRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState<MediaRow | null>(null);
  const [previewIncludeInactive, setPreviewIncludeInactive] = useState(false);
  const [tableFilter, setTableFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const [c, m] = await Promise.all([
        adminFetchJson<{ items?: Category[] }>("/api/admin/categories"),
        adminFetchJson<{ items?: MediaRow[] }>("/api/admin/media"),
      ]);
      setCategories(c.items ?? []);
      setItems((m.items ?? []).map((row) => ({ ...row, usageLabels: row.usageLabels ?? [] })));
    } catch (error) {
      setLoadError(adminFetchErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filteredItems = useMemo(() => {
    const q = tableFilter.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (m) =>
        m.titleEn.toLowerCase().includes(q) ||
        m.titleAr.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.usageLabels ?? []).some((u) => u.toLowerCase().includes(q)),
    );
  }, [items, tableFilter]);

  const masonryItems = useMemo(() => {
    const list = previewIncludeInactive ? items : items.filter((m) => m.active);
    return list.map((m) => ({
      id: m.id,
      type: m.type,
      filePath: m.filePath,
      url: m.url,
      titleEn: m.titleEn,
      titleAr: m.titleAr,
      sortOrder: m.sortOrder,
      category: m.category ? { nameEn: m.category.nameEn, nameAr: m.category.nameAr } : null,
    }));
  }, [items, previewIncludeInactive]);

  return (
    <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_min(420px,38%)] xl:items-start">
      <div className="min-w-0 space-y-10">
      {loading ? (
        <p className="border border-line/60 bg-neutral-950/40 p-4 text-sm text-muted">Loading media library…</p>
      ) : null}
      {loadError ? (
        <div className="border border-red-900/70 bg-red-950/20 p-5">
          <p className="text-sm text-red-200">Could not load media library.</p>
          <p className="mt-2 text-xs text-neutral-400">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void reload();
            }}
            className="mt-4 border border-white px-5 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black"
          >
            Retry
          </button>
        </div>
      ) : null}
      <form
        className="space-y-4 border border-line p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg(null);
          const fd = new FormData(e.currentTarget);
          const file = fd.get("file");
          let filePath: string | null = null;
          if (file instanceof File && file.size > 0) {
            const up = new FormData();
            up.append("file", file);
            const res = await fetch("/api/admin/upload", { method: "POST", body: up });
            if (!res.ok) {
              setMsg("Upload failed.");
              return;
            }
            const json = await res.json();
            filePath = json.filePath;
          }
          const url = String(fd.get("url") || "").trim() || null;
          if (!filePath && !url) {
            setMsg("Provide a file or a URL.");
            return;
          }
          const type = fd.get("type") === "VIDEO" ? MediaType.VIDEO : MediaType.IMAGE;
          const res = await fetch("/api/admin/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: fd.get("title"),
              type,
              filePath,
              url,
              categoryId: String(fd.get("categoryId") || "") || null,
              sortOrder: Number(fd.get("sortOrder") || 0),
              active: fd.get("active") === "on",
              featured: fd.get("featured") === "on",
            }),
          });
          if (!res.ok) {
            setMsg("Could not save media.");
            return;
          }
          e.currentTarget.reset();
          await reload();
          setMsg("Media item created.");
        }}
      >
        <h2 className="text-sm uppercase tracking-[0.25em] text-muted">New gallery item</h2>
        <p className="text-xs text-muted">
          Titles are saved in English and Arabic; a single title field copies to both. Assign a category for the Galleries page; mark featured for the home
          strip; hero media uses separate Hero and Page heroes screens.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Title</span>
            <input name="title" required className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Type</span>
            <select name="type" className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm">
              <option value={MediaType.IMAGE}>Image</option>
              <option value={MediaType.VIDEO}>Video</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Upload file</span>
            <input name="file" type="file" className="mt-2 w-full text-sm" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Or external URL</span>
            <input name="url" className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" placeholder="https://…" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Category (Galleries filter)</span>
            <select name="categoryId" className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm">
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameEn}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Sort order</span>
            <input name="sortOrder" type="number" defaultValue={0} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked className="h-4 w-4" />
            Active (visible on site)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="featured" className="h-4 w-4" />
            Featured (home strip)
          </label>
        </div>
        <button type="submit" className="mt-4 border border-white px-6 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black">
          Save media
        </button>
      </form>

      {editing ? (
        <form
          className="space-y-4 border border-amber-900/50 bg-neutral-950 p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setMsg(null);
            const fd = new FormData(e.currentTarget);
            const res = await fetch(`/api/admin/media/${editing.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                titleEn: String(fd.get("titleEn") || ""),
                titleAr: String(fd.get("titleAr") || ""),
                type: fd.get("type") === "VIDEO" ? MediaType.VIDEO : MediaType.IMAGE,
                url: String(fd.get("url") || "").trim() || null,
                categoryId: String(fd.get("categoryId") || "") || null,
                sortOrder: Number(fd.get("sortOrder") || 0),
                active: fd.get("active") === "on",
                featured: fd.get("featured") === "on",
              }),
            });
            if (!res.ok) {
              setMsg("Could not update media.");
              return;
            }
            setEditing(null);
            await reload();
            setMsg("Media updated.");
          }}
        >
          <h2 className="text-sm uppercase tracking-[0.25em] text-muted">Edit media</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Title (EN)</span>
              <input name="titleEn" defaultValue={editing.titleEn} required className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Title (AR)</span>
              <input name="titleAr" defaultValue={editing.titleAr} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Type</span>
              <select name="type" defaultValue={editing.type} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm">
                <option value={MediaType.IMAGE}>Image</option>
                <option value={MediaType.VIDEO}>Video</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">External URL (or rely on uploaded file)</span>
              <input name="url" defaultValue={editing.url ?? ""} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Category</span>
              <select name="categoryId" defaultValue={editing.categoryId ?? ""} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm">
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Sort order</span>
              <input name="sortOrder" type="number" defaultValue={editing.sortOrder} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={editing.active} className="h-4 w-4" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={editing.featured} className="h-4 w-4" />
              Featured
            </label>
          </div>
          <div className="flex gap-4">
            <button type="submit" className="border border-white px-6 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black">
              Save changes
            </button>
            <button
              type="button"
              className="border border-line px-6 py-2 text-xs uppercase tracking-[0.2em] text-muted hover:text-white"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        <label className="block max-w-md">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">Search library</span>
          <input
            type="search"
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            placeholder="Title, id, or usage…"
            className="mt-2 min-h-[44px] w-full border border-line bg-black px-3 py-2.5 text-sm"
          />
        </label>
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-[0.2em] text-muted">
            <tr>
              <th className="px-4 py-3">Preview</th>
              <th className="px-4 py-3">Title (EN)</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Placement / usage</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((m) => (
              <tr key={m.id} className="border-b border-line">
                <td className="px-4 py-3 align-top">
                  <MediaPreview m={m} />
                </td>
                <td className="px-4 py-3 align-top">{m.titleEn}</td>
                <td className="px-4 py-3 align-top text-muted">{m.type}</td>
                <td className="max-w-xs px-4 py-3 align-top text-xs text-neutral-400">
                  <ul className="list-inside list-disc space-y-1">
                    {(m.usageLabels ?? []).map((u) => (
                      <li key={u}>{u}</li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-3 align-top">{m.sortOrder}</td>
                <td className="px-4 py-3 align-top">
                  <Toggle
                    value={m.active}
                    onToggle={async (next) => {
                      await fetch(`/api/admin/media/${m.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ active: next }),
                      });
                      await reload();
                    }}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <Toggle
                    value={m.featured}
                    onToggle={async (next) => {
                      await fetch(`/api/admin/media/${m.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ featured: next }),
                      });
                      await reload();
                    }}
                  />
                </td>
                <td className="space-x-3 px-4 py-3 text-right align-top">
                  <button
                    type="button"
                    className="text-xs uppercase tracking-[0.2em] text-muted hover:text-white"
                    onClick={() => setEditing(m)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs uppercase tracking-[0.2em] text-muted hover:text-white"
                    onClick={async () => {
                      if (!confirm("Delete this item?")) return;
                      await fetch(`/api/admin/media/${m.id}`, { method: "DELETE" });
                      await reload();
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && !loadError && filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">
                  {items.length === 0
                    ? "No media items yet. Add one above, or check /api/admin/media if public media exists."
                    : "No media items match this search."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      </div>
      {msg ? <p className="text-sm text-neutral-300">{msg}</p> : null}
      </div>

      <div className="min-w-0 xl:sticky xl:top-6">
        <AdminPreviewFrame
          placement="Site · Galleries — masonry grid"
          detail="Public routes: /en/portfolio and /ar/portfolio (active items only on site)"
        >
          {(viewport) => (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={previewIncludeInactive}
                    onChange={(e) => setPreviewIncludeInactive(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Include inactive items in preview
                </label>
              </div>
              <AdminGalleryMasonryPreview
                viewport={viewport}
                items={masonryItems}
                titleLabel={previewIncludeInactive ? "Preview (all rows)" : "Preview (active only — like public site)"}
              />
            </div>
          )}
        </AdminPreviewFrame>
      </div>
    </div>
  );
}

function Toggle({ value, onToggle }: { value: boolean; onToggle: (next: boolean) => Promise<void> }) {
  return (
    <button type="button" className="text-xs uppercase tracking-[0.2em] text-muted hover:text-white" onClick={() => onToggle(!value)}>
      {value ? "On" : "Off"}
    </button>
  );
}
