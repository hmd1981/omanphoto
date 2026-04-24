import { revalidatePath } from "next/cache";

type RevalidateOpts = {
  /** When a single service’s gallery or slug is updated, also refresh its public detail route. */
  serviceSlug?: string | null;
  /** After a slug rename, invalidate the old public URL as well. */
  previousServiceSlug?: string | null;
};

/**
 * Invalidate Next.js cached public routes after CMS changes so /en and /ar pick up new content immediately.
 * Safe to call from Route Handlers and Server Actions.
 */
export function revalidatePublicPages(opts?: RevalidateOpts): void {
  try {
    revalidatePath("/en", "layout");
    revalidatePath("/ar", "layout");
    for (const locale of ["en", "ar"] as const) {
      revalidatePath(`/${locale}/ai-studio`, "page");
      revalidatePath(`/${locale}/book`, "page");
      revalidatePath(`/${locale}/services`, "page");
      if (opts?.serviceSlug) {
        revalidatePath(`/${locale}/services/${opts.serviceSlug}`, "page");
      }
      if (opts?.previousServiceSlug) {
        revalidatePath(`/${locale}/services/${opts.previousServiceSlug}`, "page");
      }
    }
  } catch {
    // revalidatePath only runs in a request context; ignore if ever called elsewhere
  }
}
