import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export default function AdminSitePage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Site settings</h1>
      <p className="mt-4 max-w-2xl text-sm text-muted">
        Global brand name, navigation labels, footer, and default SEO. Page-specific SEO is edited under Page text (
        <code className="text-neutral-400">seo</code> / section keys).
      </p>
      <SiteSettingsForm />
    </div>
  );
}
