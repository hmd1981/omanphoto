import { JournalManager } from "@/components/admin/journal-manager";

export default function AdminJournalPage() {
  return (
    <div>
      <h1 className="font-display text-2xl tracking-[0.12em]">Journal</h1>
      <p className="mt-4 max-w-2xl text-sm font-light leading-relaxed text-muted">
        Editorial articles on the public site at <code className="text-neutral-300">/en/journal</code> and{" "}
        <code className="text-neutral-300">/ar/journal</code>. Substantive posts help AdSense and search quality
        reviews.
      </p>
      <JournalManager />
    </div>
  );
}
