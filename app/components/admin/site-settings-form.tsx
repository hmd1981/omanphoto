"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@prisma/client";

const inputCls = "mt-2 w-full border border-line bg-black px-3 py-2 text-sm";

function BilingualField({
  label,
  nameEn,
  nameAr,
  valEn,
  valAr,
  rows,
}: {
  label: string;
  nameEn: string;
  nameAr: string;
  valEn: string;
  valAr: string;
  rows?: number;
}) {
  const Tag = rows ? "textarea" : "input";
  return (
    <fieldset className="space-y-3 border border-line/30 px-4 py-4">
      <legend className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</legend>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted">English</span>
        <Tag name={nameEn} defaultValue={valEn} {...(rows ? { rows } : {})} className={inputCls} />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.15em] text-muted">العربية</span>
        <Tag name={nameAr} defaultValue={valAr} {...(rows ? { rows } : {})} className={inputCls} dir="rtl" />
      </label>
    </fieldset>
  );
}

export function SiteSettingsForm() {
  const [s, setS] = useState<SiteSettings | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/site-settings");
      const json = await res.json();
      setS(json.settings);
    })();
  }, []);

  if (!s) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <form
      className="mt-10 max-w-2xl space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setMsg(null);
        const fd = new FormData(e.currentTarget);
        const v = (name: string) => (fd.get(name) as string ?? "").trim();

        const res = await fetch("/api/admin/site-settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brandName: v("brandName"),
            footerTaglineEn: v("footerTaglineEn") || null,
            footerTaglineAr: v("footerTaglineAr") || null,
            footerEmail: v("footerEmail") || null,
            footerPhone: v("footerPhone") || null,
            instagramUrl: v("instagramUrl") || null,
            whatsappUrl: v("whatsappUrl") || null,
            mapEmbedUrl: v("mapEmbedUrl") || null,
            mapPageUrl: v("mapPageUrl") || null,
            footerLocationLine: v("footerLocationLine") || null,
            footerBookLabelEn: v("footerBookLabelEn") || "Book a session",
            footerBookLabelAr: v("footerBookLabelAr") || "احجز جلسة",
            copyrightName: v("copyrightName"),
            heroEyebrowEn: v("heroEyebrowEn") || null,
            heroEyebrowAr: v("heroEyebrowAr") || null,
            navHomeEn: v("navHomeEn") || "Home",
            navHomeAr: v("navHomeAr") || "الرئيسية",
            navPortfolioEn: v("navPortfolioEn") || "Galleries",
            navPortfolioAr: v("navPortfolioAr") || "المعارض",
            navServicesEn: v("navServicesEn") || "Services",
            navServicesAr: v("navServicesAr") || "الخدمات",
            navAboutEn: v("navAboutEn") || "About",
            navAboutAr: v("navAboutAr") || "من نحن",
            navContactEn: v("navContactEn") || "Contact",
            navContactAr: v("navContactAr") || "تواصل",
            navMenuLabelEn: v("navMenuLabelEn") || "Menu",
            navMenuLabelAr: v("navMenuLabelAr") || "القائمة",
            defaultMetaTitleEn: v("defaultMetaTitleEn") || null,
            defaultMetaTitleAr: v("defaultMetaTitleAr") || null,
            defaultMetaDescriptionEn: v("defaultMetaDescriptionEn") || null,
            defaultMetaDescriptionAr: v("defaultMetaDescriptionAr") || null,
          }),
        });
        if (!res.ok) {
          setMsg("Could not save.");
          return;
        }
        const json = await res.json();
        setS(json.settings);
        setMsg("Saved.");
      }}
    >
      <h2 className="text-xs uppercase tracking-[0.25em] text-muted">Brand & footer</h2>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Brand name</span>
        <input name="brandName" defaultValue={s.brandName} className={inputCls} />
      </label>

      <BilingualField
        label="Footer tagline"
        nameEn="footerTaglineEn"
        nameAr="footerTaglineAr"
        valEn={s.footerTaglineEn ?? ""}
        valAr={s.footerTaglineAr ?? ""}
        rows={3}
      />

      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Footer email</span>
        <input name="footerEmail" defaultValue={s.footerEmail ?? ""} className={inputCls} />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Phone (display + tel: link)</span>
        <input name="footerPhone" defaultValue={s.footerPhone ?? ""} className={inputCls} placeholder="+968 …" />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Instagram URL</span>
        <input name="instagramUrl" defaultValue={s.instagramUrl ?? ""} className={inputCls} />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">WhatsApp URL</span>
        <input name="whatsappUrl" defaultValue={s.whatsappUrl ?? ""} className={inputCls} />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Google Maps embed URL (iframe src)</span>
        <input name="mapEmbedUrl" defaultValue={s.mapEmbedUrl ?? ""} className={inputCls} placeholder="https://maps.google.com/maps?...&output=embed" />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Google Maps page link (open in Maps)</span>
        <input name="mapPageUrl" defaultValue={s.mapPageUrl ?? ""} className={inputCls} placeholder="https://maps.app.goo.gl/..." />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Location line</span>
        <input name="footerLocationLine" defaultValue={s.footerLocationLine ?? ""} className={inputCls} />
      </label>

      <BilingualField
        label="Book CTA label"
        nameEn="footerBookLabelEn"
        nameAr="footerBookLabelAr"
        valEn={s.footerBookLabelEn}
        valAr={s.footerBookLabelAr}
      />

      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">Copyright name</span>
        <input name="copyrightName" defaultValue={s.copyrightName} className={inputCls} />
      </label>

      <BilingualField
        label="Hero eyebrow (fallback)"
        nameEn="heroEyebrowEn"
        nameAr="heroEyebrowAr"
        valEn={s.heroEyebrowEn ?? ""}
        valAr={s.heroEyebrowAr ?? ""}
      />

      <h2 className="pt-6 text-xs uppercase tracking-[0.25em] text-muted">Navigation labels</h2>
      <div className="space-y-6">
        <BilingualField label="Home" nameEn="navHomeEn" nameAr="navHomeAr" valEn={s.navHomeEn} valAr={s.navHomeAr} />
        <BilingualField label="Galleries (nav link to /portfolio)" nameEn="navPortfolioEn" nameAr="navPortfolioAr" valEn={s.navPortfolioEn} valAr={s.navPortfolioAr} />
        <BilingualField label="Services" nameEn="navServicesEn" nameAr="navServicesAr" valEn={s.navServicesEn} valAr={s.navServicesAr} />
        <BilingualField label="About" nameEn="navAboutEn" nameAr="navAboutAr" valEn={s.navAboutEn} valAr={s.navAboutAr} />
        <BilingualField label="Contact" nameEn="navContactEn" nameAr="navContactAr" valEn={s.navContactEn} valAr={s.navContactAr} />
        <BilingualField label="Mobile menu label" nameEn="navMenuLabelEn" nameAr="navMenuLabelAr" valEn={s.navMenuLabelEn} valAr={s.navMenuLabelAr} />
      </div>

      <h2 className="pt-6 text-xs uppercase tracking-[0.25em] text-muted">Default SEO (fallback)</h2>
      <BilingualField label="Meta title" nameEn="defaultMetaTitleEn" nameAr="defaultMetaTitleAr" valEn={s.defaultMetaTitleEn ?? ""} valAr={s.defaultMetaTitleAr ?? ""} />
      <BilingualField
        label="Meta description"
        nameEn="defaultMetaDescriptionEn"
        nameAr="defaultMetaDescriptionAr"
        valEn={s.defaultMetaDescriptionEn ?? ""}
        valAr={s.defaultMetaDescriptionAr ?? ""}
        rows={4}
      />

      <button type="submit" className="border border-white px-8 py-3 text-xs uppercase tracking-[0.25em] hover:bg-white hover:text-black">
        Save site settings
      </button>
      {msg ? <p className="text-sm text-ink-muted">{msg}</p> : null}
    </form>
  );
}
