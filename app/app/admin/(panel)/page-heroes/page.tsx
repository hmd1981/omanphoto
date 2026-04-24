import { PageHeroesManager } from "@/components/admin/page-heroes-manager";

export const metadata = {
  title: "Page heroes",
};

export default function AdminPageHeroesPage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-[0.08em]">Page heroes</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted">
        PORTFOLIO_HERO, SERVICES_HERO, ABOUT_HERO, CONTACT_HERO, AI_STUDIO_HERO, and BOOK_HERO control the top right media panel
        on Galleries, Services, Studio, Enquire, AI Studio, and Book. Headlines and body copy for AI Studio and Book are edited
        under Page text (<code className="text-neutral-300">pageKey</code> <code className="text-neutral-300">ai_studio</code>{" "}
        and <code className="text-neutral-300">book</code>).
      </p>
      <PageHeroesManager />
    </div>
  );
}
