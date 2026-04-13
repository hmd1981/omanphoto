"use client";

import { useEffect, useState } from "react";
import { CopyEnToArButton } from "@/components/admin/copy-en-to-ar-button";

type Row = {
  id: string;
  pageKey: string;
  sectionKey: string;
  titleEn: string | null;
  titleAr: string | null;
  bodyEn: string | null;
  bodyAr: string | null;
  sortOrder: number;
  published: boolean;
};

export function PageContentManager() {
  const [items, setItems] = useState<Row[]>([]);

  async function reload() {
    const res = await fetch("/api/admin/page-content");
    const json = await res.json();
    setItems(json.items);
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <div className="mt-10 space-y-8">
      <p className="max-w-2xl text-sm leading-relaxed text-neutral-500">
        English and Arabic are edited separately. The public site shows only the active locale — it does not substitute English on Arabic
        pages unless you use the optional button below to copy into empty Arabic fields before saving.
      </p>
      <form
        id="page-block-new"
        className="space-y-4 border border-line p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          await fetch("/api/admin/page-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pageKey: fd.get("pageKey"),
              sectionKey: fd.get("sectionKey"),
              titleEn: fd.get("titleEn") || null,
              titleAr: fd.get("titleAr") || null,
              bodyEn: fd.get("bodyEn") || null,
              bodyAr: fd.get("bodyAr") || null,
              sortOrder: Number(fd.get("sortOrder") || 0),
              published: fd.get("published") === "on",
            }),
          });
          e.currentTarget.reset();
          await reload();
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm uppercase tracking-[0.25em] text-muted">New content block</h2>
          <CopyEnToArButton formId="page-block-new" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Page key</span>
            <input name="pageKey" required className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" placeholder="home" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Section key</span>
            <input name="sectionKey" required className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" placeholder="intro" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Title (English)</span>
            <input name="titleEn" className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Title (Arabic)</span>
            <input name="titleAr" className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" dir="rtl" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Body (English)</span>
            <textarea name="bodyEn" rows={4} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Body (Arabic)</span>
            <textarea name="bodyAr" rows={4} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" dir="rtl" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-[0.2em] text-muted">Sort</span>
            <input name="sortOrder" type="number" defaultValue={0} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked className="h-4 w-4" />
            Published
          </label>
        </div>
        <button type="submit" className="mt-4 border border-white px-6 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black">
          Add block
        </button>
      </form>

      <div className="space-y-6">
        {items.map((p) => (
          <form
            key={p.id}
            id={`page-block-${p.id}`}
            className="border border-line p-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await fetch(`/api/admin/page-content/${p.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  pageKey: fd.get("pageKey"),
                  sectionKey: fd.get("sectionKey"),
                  titleEn: fd.get("titleEn") || null,
                  titleAr: fd.get("titleAr") || null,
                  bodyEn: fd.get("bodyEn") || null,
                  bodyAr: fd.get("bodyAr") || null,
                  sortOrder: Number(fd.get("sortOrder") || 0),
                  published: fd.get("published") === "on",
                }),
              });
              await reload();
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.25em] text-muted">
                {p.pageKey} · {p.sectionKey}
              </p>
              <CopyEnToArButton formId={`page-block-${p.id}`} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">Page key</span>
                <input name="pageKey" defaultValue={p.pageKey} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">Section key</span>
                <input name="sectionKey" defaultValue={p.sectionKey} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">Title (English)</span>
                <input name="titleEn" defaultValue={p.titleEn ?? ""} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">Title (Arabic)</span>
                <input name="titleAr" defaultValue={p.titleAr ?? ""} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" dir="rtl" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">Body (English)</span>
                <textarea name="bodyEn" defaultValue={p.bodyEn ?? ""} rows={4} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">Body (Arabic)</span>
                <textarea name="bodyAr" defaultValue={p.bodyAr ?? ""} rows={4} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" dir="rtl" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">Sort</span>
                <input name="sortOrder" type="number" defaultValue={p.sortOrder} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="published" defaultChecked={p.published} className="h-4 w-4" />
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
                  if (!confirm("Delete block?")) return;
                  await fetch(`/api/admin/page-content/${p.id}`, { method: "DELETE" });
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
  );
}
