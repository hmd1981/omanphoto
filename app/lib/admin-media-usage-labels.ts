import { PageHeroPlacement } from "@/lib/generated/prisma/browser";

/** Labels must match GET /api/admin/media usage enrichment. */
export const PAGE_HERO_USAGE_LABEL: Record<PageHeroPlacement, string> = {
  PORTFOLIO_HERO: "Page hero — Galleries (/portfolio)",
  SERVICES_HERO: "Page hero — Services (/services)",
  ABOUT_HERO: "Page hero — Studio (/about)",
  CONTACT_HERO: "Page hero — Enquire (/contact)",
  AI_STUDIO_HERO: "Page hero — AI Studio (/ai-studio)",
  BOOK_HERO: "Page hero — Book (/book)",
};

export function pageHeroUsageLine(placement: PageHeroPlacement, role: "image" | "video"): string {
  return `${PAGE_HERO_USAGE_LABEL[placement]} · ${role}`;
}

export const HOME_HERO_IMAGE_USAGE = "Home hero — image background";
export const HOME_HERO_VIDEO_USAGE = "Home hero — video background";
