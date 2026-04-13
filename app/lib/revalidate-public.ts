import { revalidatePath } from "next/cache";

/**
 * Invalidate Next.js cached public routes after CMS changes so /en and /ar pick up new content immediately.
 * Safe to call from Route Handlers and Server Actions.
 */
export function revalidatePublicPages(): void {
  try {
    revalidatePath("/en", "layout");
    revalidatePath("/ar", "layout");
  } catch {
    // revalidatePath only runs in a request context; ignore if ever called elsewhere
  }
}
