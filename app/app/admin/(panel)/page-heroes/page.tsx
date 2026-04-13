import { PageHeroesManager } from "@/components/admin/page-heroes-manager";

export const metadata = {
  title: "Page heroes",
};

export default function AdminPageHeroesPage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-[0.08em]">Page heroes</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted">
        PORTFOLIO_HERO, SERVICES_HERO, ABOUT_HERO, and CONTACT_HERO control the top right media panel on Galleries, Services,
        Studio, and Enquire.
      </p>
      <PageHeroesManager />
    </div>
  );
}
