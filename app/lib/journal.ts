import type { JournalPost, Media } from "@/lib/generated/prisma/browser";
import type { Locale } from "./locale";
import { pickText } from "./locale";

export type JournalPostWithCover = JournalPost & { coverMedia: Media | null };

export function journalTitle(locale: Locale, post: JournalPost): string {
  return pickText(locale, post.titleEn, post.titleAr);
}

export function journalExcerpt(locale: Locale, post: JournalPost): string {
  return pickText(locale, post.excerptEn, post.excerptAr);
}

export function journalBody(locale: Locale, post: JournalPost): string {
  return pickText(locale, post.bodyEn, post.bodyAr);
}
