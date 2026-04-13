"use client";

import { useEffect, useState } from "react";

type Category = {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  sortOrder: number;
  published: boolean;
};

export function CategoriesManager() {
  const [items, setItems] = useState<Category[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    const res = await fetch("/api/admin/categories");
    const json = await res.json();
    setItems(json.items);
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <div className="mt-10 space-y-10">
      <form
        className="grid gap-4 border border-line p-6 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setMsg(null);
          const fd = new FormData(e.currentTarget);
          const res = await fetch("/api/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nameEn: fd.get("nameEn"),
              nameAr: fd.get("nameAr"),
              slug: fd.get("slug"),
              descriptionEn: fd.get("descriptionEn") || null,
              descriptionAr: fd.get("descriptionAr") || null,
              sortOrder: Number(fd.get("sortOrder") || 0),
              published: fd.get("published") === "on",
            }),
          });
          if (!res.ok) {
            setMsg("Could not create category.");
            return;
          }
          e.currentTarget.reset();
          await reload();
          setMsg("Category created.");
        }}
      >
        <h2 className="md:col-span-2 text-sm uppercase tracking-[0.25em] text-muted">New category</h2>
        <label className="block md:col-span-1">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">Name (English)</span>
          <input name="nameEn" required className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
        </label>
        <label className="block md:col-span-1">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">Name (Arabic)</span>
          <input name="nameAr" required className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" dir="rtl" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">Slug</span>
          <input name="slug" required className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" placeholder="weddings" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">Description (English)</span>
          <textarea name="descriptionEn" rows={2} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs uppercase tracking-[0.2em] text-muted">Description (Arabic)</span>
          <textarea name="descriptionAr" rows={2} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" dir="rtl" />
        </label>
        <label className="flex items-center gap-2 md:col-span-1">
          <input type="number" name="sortOrder" defaultValue={0} className="w-full border border-line bg-black px-3 py-2 text-sm" />
          <span className="text-xs text-muted">Sort</span>
        </label>
        <label className="flex items-center gap-2 md:col-span-1 text-sm">
          <input type="checkbox" name="published" defaultChecked className="h-4 w-4" />
          Published
        </label>
        <button type="submit" className="md:col-span-2 border border-white px-6 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black">
          Add category
        </button>
      </form>

      <div className="space-y-6">
        {items.map((c) => (
          <form
            key={c.id}
            className="border border-line p-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              await fetch(`/api/admin/categories/${c.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  nameEn: fd.get("nameEn"),
                  nameAr: fd.get("nameAr"),
                  slug: fd.get("slug"),
                  descriptionEn: fd.get("descriptionEn") || null,
                  descriptionAr: fd.get("descriptionAr") || null,
                  sortOrder: Number(fd.get("sortOrder") || 0),
                  published: fd.get("published") === "on",
                }),
              });
              await reload();
            }}
          >
            <p className="text-xs text-muted">
              Slug: <span className="text-white">{c.slug}</span>
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-1">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">Name (English)</span>
                <input name="nameEn" defaultValue={c.nameEn} required className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
              </label>
              <label className="block md:col-span-1">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">Name (Arabic)</span>
                <input name="nameAr" defaultValue={c.nameAr} required className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" dir="rtl" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">Slug</span>
                <input name="slug" defaultValue={c.slug} required className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">Description (English)</span>
                <textarea name="descriptionEn" defaultValue={c.descriptionEn ?? ""} rows={2} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
              </label>
              <label className="block md:col-span-2">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">Description (Arabic)</span>
                <textarea name="descriptionAr" defaultValue={c.descriptionAr ?? ""} rows={2} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" dir="rtl" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-muted">Sort</span>
                <input name="sortOrder" type="number" defaultValue={c.sortOrder} className="mt-2 w-full border border-line bg-black px-3 py-2 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="published" defaultChecked={c.published} className="h-4 w-4" />
                Published
              </label>
            </div>
            <div className="mt-4 flex gap-4">
              <button type="submit" className="border border-white px-6 py-2 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black">
                Save
              </button>
              <button
                type="button"
                className="text-xs uppercase tracking-[0.2em] text-muted hover:text-white"
                onClick={async () => {
                  if (!confirm("Delete this category?")) return;
                  await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" });
                  await reload();
                }}
              >
                Delete
              </button>
            </div>
          </form>
        ))}
      </div>
      {msg ? <p className="text-sm text-neutral-300">{msg}</p> : null}
    </div>
  );
}
