"use client";

import { useCallback, useEffect, useState } from "react";
import type { MediaPickItem } from "@/components/admin/media-placement-picker";

type JournalRow = {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string | null;
  excerptAr: string | null;
  bodyEn: string;
  bodyAr: string;
  coverMediaId: string | null;
  published: boolean;
  publishedAt: string;
  sortOrder: number;
};

type JournalFormRow = {
  slug: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string | null;
  excerptAr: string | null;
  bodyEn: string;
  bodyAr: string;
  coverMediaId: string | null;
  published: boolean;
  sortOrder: number;
};

const emptyNew: JournalFormRow = {
  slug: "",
  titleEn: "",
  titleAr: "",
  excerptEn: "",
  excerptAr: "",
  bodyEn: "",
  bodyAr: "",
  coverMediaId: null,
  published: true,
  sortOrder: 0,
};

export function JournalManager() {
  const [rows, setRows] = useState<JournalRow[]>([]);
  const [newRow, setNewRow] = useState(emptyNew);
  const [allMedia, setAllMedia] = useState<MediaPickItem[]>([]);

  const loadMedia = useCallback(async () => {
    const res = await fetch("/api/admin/media");
    const json = await res.json();
    setAllMedia((json.items ?? []) as MediaPickItem[]);
  }, []);

  async function reload() {
    const res = await fetch("/api/admin/journal");
    const json = await res.json();
    setRows(json.items as JournalRow[]);
  }

  useEffect(() => {
    void reload();
    void loadMedia();
  }, [loadMedia]);

  function patch(id: string, patch: Partial<JournalRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  return (
    <div className="mt-10 space-y-10">
      <form
        className="space-y-4 border border-line p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          await fetch("/api/admin/journal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...newRow,
              coverMediaId: newRow.coverMediaId || null,
              excerptEn: newRow.excerptEn || undefined,
              excerptAr: newRow.excerptAr || undefined,
            }),
          });
          setNewRow(emptyNew);
          await reload();
        }}
      >
        <h2 className="text-sm uppercase tracking-[0.25em] text-muted">New article</h2>
        <JournalFields
          row={newRow}
          onChange={(p) => setNewRow((s) => ({ ...s, ...p }))}
          allMedia={allMedia}
        />
        <button
          type="submit"
          className="mt-4 border border-white px-6 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black"
        >
          Add article
        </button>
      </form>

      <div className="space-y-6">
        {rows.map((r) => (
          <form
            key={r.id}
            className="border border-line p-6"
            onSubmit={async (e) => {
              e.preventDefault();
              await fetch(`/api/admin/journal/${r.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  slug: r.slug,
                  titleEn: r.titleEn,
                  titleAr: r.titleAr,
                  excerptEn: r.excerptEn,
                  excerptAr: r.excerptAr,
                  bodyEn: r.bodyEn,
                  bodyAr: r.bodyAr,
                  coverMediaId: r.coverMediaId,
                  published: r.published,
                  sortOrder: r.sortOrder,
                }),
              });
              await reload();
            }}
          >
            <JournalFields row={r} onChange={(p) => patch(r.id, p)} allMedia={allMedia} />
            <div className="mt-4 flex gap-4">
              <button
                type="submit"
                className="border border-white px-6 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black"
              >
                Update
              </button>
              <button
                type="button"
                className="text-xs uppercase tracking-[0.2em] text-muted hover:text-white"
                onClick={async () => {
                  if (!confirm("Delete article?")) return;
                  await fetch(`/api/admin/journal/${r.id}`, { method: "DELETE" });
                  await reload();
                }}
              >
                Delete
              </button>
              <a
                href={`/en/journal/${r.slug}`}
                className="self-center text-xs uppercase tracking-[0.2em] text-amber-100/90 hover:text-amber-50"
                target="_blank"
                rel="noreferrer"
              >
                Preview EN
              </a>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}

function JournalFields({
  row,
  onChange,
  allMedia,
}: {
  row: JournalFormRow;
  onChange: (p: Partial<JournalFormRow>) => void;
  allMedia: MediaPickItem[];
}) {
  const inputCls = "mt-2 w-full border border-line bg-black px-3 py-2 text-sm";
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block md:col-span-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Slug</span>
        <input value={row.slug} onChange={(e) => onChange({ slug: e.target.value })} required className={inputCls} />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Title (English)</span>
        <input value={row.titleEn} onChange={(e) => onChange({ titleEn: e.target.value })} required className={inputCls} />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Title (Arabic)</span>
        <input
          value={row.titleAr}
          onChange={(e) => onChange({ titleAr: e.target.value })}
          required
          className={inputCls}
          dir="rtl"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Excerpt (English)</span>
        <textarea
          value={row.excerptEn ?? ""}
          onChange={(e) => onChange({ excerptEn: e.target.value })}
          rows={2}
          className={inputCls}
        />
      </label>
      <label className="block md:col-span-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Excerpt (Arabic)</span>
        <textarea
          value={row.excerptAr ?? ""}
          onChange={(e) => onChange({ excerptAr: e.target.value })}
          rows={2}
          className={inputCls}
          dir="rtl"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Body (English) — separate paragraphs with blank lines</span>
        <textarea value={row.bodyEn} onChange={(e) => onChange({ bodyEn: e.target.value })} required rows={12} className={inputCls} />
      </label>
      <label className="block md:col-span-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Body (Arabic)</span>
        <textarea
          value={row.bodyAr}
          onChange={(e) => onChange({ bodyAr: e.target.value })}
          required
          rows={12}
          className={inputCls}
          dir="rtl"
        />
      </label>
      <label className="block md:col-span-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Cover image (optional)</span>
        <select
          value={row.coverMediaId ?? ""}
          onChange={(e) => onChange({ coverMediaId: e.target.value || null })}
          className={inputCls}
        >
          <option value="">— None —</option>
          {allMedia
            .filter((m) => m.type === "IMAGE")
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.titleEn}
              </option>
            ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Sort</span>
        <input
          type="number"
          value={row.sortOrder}
          onChange={(e) => onChange({ sortOrder: Number(e.target.value) })}
          className={inputCls}
        />
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input
          type="checkbox"
          checked={row.published}
          onChange={(e) => onChange({ published: e.target.checked })}
          className="h-4 w-4"
        />
        Published
      </label>
    </div>
  );
}
