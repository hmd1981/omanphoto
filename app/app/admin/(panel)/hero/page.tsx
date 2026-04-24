import { HeroForm } from "@/components/admin/hero-form";

export default function AdminHeroPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Homepage intro (hero)</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted">
        This is the opening section visitors see at the top of <code className="text-neutral-300">/en</code> and <code className="text-neutral-300">/ar</code>.
        Pick a still image <strong>or</strong> a motion video as the background, then edit the eyebrow, title, subtitle, and CTA.
        Edits update the live preview on the right instantly. Save to persist.
      </p>
      <HeroForm />
    </div>
  );
}
