import { revalidatePath } from "next/cache";

type RevalidateOpts = {
  serviceSlug?: string | null;
  previousServiceSlug?: string | null;
  journalSlug?: string | null;
  previousJournalSlug?: string | null;
};

const PUBLIC_PAGE_PATHS = [
  "",
  "/portfolio",
  "/services",
  "/about",
  "/contact",
  "/book",
  "/ai-studio",
  "/journal",
  "/privacy",
  "/terms",
] as const;

/**
 * Invalidate Next.js cached public routes after CMS changes so /en and /ar pick up new content immediately.
 * Safe to call from Route Handlers and Server Actions.
 */
export function revalidatePublicPages(opts?: RevalidateOpts): void {
  try {
    revalidatePath("/en", "layout");
    revalidatePath("/ar", "layout");
    for (const locale of ["en", "ar"] as const) {
      for (const segment of PUBLIC_PAGE_PATHS) {
        revalidatePath(`/${locale}${segment}`, segment === "" ? "layout" : "page");
      }
      revalidatePath(`/${locale}/ai-studio`, "page");
      revalidatePath(`/${locale}/book`, "page");
      revalidatePath(`/${locale}/services`, "page");
      if (opts?.serviceSlug) {
        revalidatePath(`/${locale}/services/${opts.serviceSlug}`, "page");
      }
      if (opts?.previousServiceSlug) {
        revalidatePath(`/${locale}/services/${opts.previousServiceSlug}`, "page");
      }
      if (opts?.journalSlug) {
        revalidatePath(`/${locale}/journal/${opts.journalSlug}`, "page");
      }
      if (opts?.previousJournalSlug) {
        revalidatePath(`/${locale}/journal/${opts.previousJournalSlug}`, "page");
      }
    }
    revalidatePath("/sitemap.xml");
  } catch {
    // revalidatePath only runs in a request context; ignore if ever called elsewhere
  }
}
