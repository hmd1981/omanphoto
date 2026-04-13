import { MediaManager } from "@/components/admin/media-manager";

export default function AdminMediaPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Galleries</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted">
        Upload images and videos or paste URLs here — assign categories, set featured items, and manage what appears on the public Galleries page (
        <code className="text-neutral-300">/portfolio</code>). The live preview updates as you edit.
      </p>
      <MediaManager />
    </div>
  );
}
