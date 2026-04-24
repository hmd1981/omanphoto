import Link from "next/link";
import { LogoutButton } from "@/components/admin/logout-button";

const adminLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/account", label: "Account" },
  { href: "/admin/site", label: "Site" },
  { href: "/admin/hero", label: "Intro / Hero" },
  { href: "/admin/page-heroes", label: "Page intros" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/media", label: "Galleries" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/pages", label: "Page text" },
  { href: "/admin/inquiries", label: "Inquiries" },
];

/** Public site routes (not under /admin); default EN preview. */
const publicSiteLinks = [
  { href: "/en/ai-studio", label: "AI Studio" },
  { href: "/en/book", label: "Book" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <Link href="/admin" className="font-display text-xl tracking-[0.15em]">
              Oman Photo
            </Link>
            <span className="text-xs uppercase tracking-[0.25em] text-muted">Administration</span>
          </div>
          <nav
            aria-label="Admin and public shortcuts"
            className="flex max-w-[min(100vw-3rem,52rem)] flex-wrap items-center gap-x-4 gap-y-3 md:max-w-none md:justify-end"
          >
            {adminLinks.map((l) => (
              <Link key={l.href} href={l.href} className="text-xs uppercase tracking-[0.2em] text-muted hover:text-white">
                {l.label}
              </Link>
            ))}
            <span className="hidden h-3 w-px shrink-0 bg-white/25 md:inline-block" aria-hidden />
            {publicSiteLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="shrink-0 text-xs uppercase tracking-[0.2em] text-amber-100/90 hover:text-amber-50"
                title="Public site (opens in same tab)"
              >
                {l.label}
              </Link>
            ))}
            <Link href="/" className="text-xs uppercase tracking-[0.2em] text-muted hover:text-white">
              View site
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-[1600px] px-6 py-12">{children}</div>
    </div>
  );
}
