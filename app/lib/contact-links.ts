import type { SiteSettings } from "@prisma/client";

/** Defaults when DB fields are unset (e.g. before seed/migration). */
export const DEFAULT_CONTACT_LINKS = {
  footerEmail: "info@omanphoto.com",
  footerPhone: "+96893376940",
  instagramUrl: "https://www.instagram.com/masterpiece_proshots/",
  whatsappUrl: "https://wa.me/message/NBV22R27A46TB1",
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3655.369928523803!2d58.48207581215373!3d23.626919478666178!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e91f9a2c012b881%3A0x3c7e13c641358cf!2sEstio%20technology%20development!5e0!3m2!1sen!2som!4v1776101745752!5m2!1sen!2som",
  mapPageUrl:
    "https://www.google.com/maps/search/?api=1&query=23.626919478666178%2C58.48207581215373",
} as const;

export type ResolvedContactLinks = {
  email: string;
  phone: string;
  telHref: string;
  instagramUrl: string;
  whatsappUrl: string;
  mapEmbedUrl: string | null;
  mapPageUrl: string;
};

function digitsOnlyTel(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return `+${digits}`;
}

/**
 * Merges SiteSettings with safe defaults. Map embed: empty string in DB hides the iframe.
 */
export function resolveContactLinks(settings: SiteSettings | null): ResolvedContactLinks {
  const d = DEFAULT_CONTACT_LINKS;
  const email = settings?.footerEmail?.trim() || d.footerEmail;
  const phone = settings?.footerPhone?.trim() || d.footerPhone;
  const instagramUrl = settings?.instagramUrl?.trim() || d.instagramUrl;
  const whatsappUrl = settings?.whatsappUrl?.trim() || d.whatsappUrl;
  const mapPageUrl = settings?.mapPageUrl?.trim() || d.mapPageUrl;

  const rawEmbed = settings?.mapEmbedUrl;
  let mapEmbedUrl: string | null;
  if (rawEmbed === null || rawEmbed === undefined) {
    mapEmbedUrl = d.mapEmbedUrl;
  } else {
    const t = rawEmbed.trim();
    mapEmbedUrl = t.length > 0 ? t : null;
  }

  return {
    email,
    phone,
    telHref: digitsOnlyTel(phone) || digitsOnlyTel(d.footerPhone),
    instagramUrl,
    whatsappUrl,
    mapEmbedUrl,
    mapPageUrl,
  };
}
