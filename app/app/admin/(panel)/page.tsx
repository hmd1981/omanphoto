import Link from "next/link";

const cards = [
  { href: "/admin/site", title: "Site settings", body: "Brand, navigation labels, footer, default SEO." },
  {
    href: "/admin/hero",
    title: "Homepage intro (hero)",
    body: "Opening section of /en and /ar. Pick a picture or a motion video as background, edit the eyebrow, title, subtitle, and CTA.",
  },
  {
    href: "/admin/page-heroes",
    title: "Page intros",
    body: "Top media beside the title on Galleries, Services, About, Contact, AI Studio, and Book — image or motion video per page.",
  },
  { href: "/admin/categories", title: "Gallery categories", body: "Create, order, and publish categories used as filters on the Galleries page." },
  { href: "/admin/media", title: "Galleries", body: "Upload images and videos, assign categories, and feature items for the public site." },
  { href: "/admin/services", title: "Services", body: "Edit the five service pillars and publish states." },
  { href: "/admin/pages", title: "Page text", body: "Manage editorial blocks across public pages." },
  { href: "/admin/inquiries", title: "Inquiries", body: "Read contact submissions." },
  { href: "/admin/account", title: "Account", body: "Change your admin password." },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="font-display text-4xl">Dashboard</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
        Content is stored in PostgreSQL. Media files live under <code className="text-neutral-300">/opt/omanphoto/uploads</code> when
        uploaded through the panel.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="border border-line p-8 transition-colors hover:border-white"
          >
            <h2 className="text-lg tracking-wide">{c.title}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">{c.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
