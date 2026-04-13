import { HeroForm } from "@/components/admin/hero-form";

export default function AdminHeroPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Homepage hero</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted">
        Edits update the live preview on the right instantly. Save to persist. Overlay copy appears on the public home page (/en, /ar).
      </p>
      <HeroForm />
    </div>
  );
}
