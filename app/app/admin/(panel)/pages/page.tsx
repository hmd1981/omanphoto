import { PageContentManager } from "@/components/admin/page-content-manager";

export default function AdminPagesContentPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Page text</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted">
        Content blocks are keyed by <code className="text-neutral-300">pageKey</code> and <code className="text-neutral-300">sectionKey</code> (for example{" "}
        <code className="text-neutral-300">home / intro</code>).
      </p>
      <PageContentManager />
    </div>
  );
}
