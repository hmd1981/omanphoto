import Link from "next/link";
import { LogoutButton } from "@/components/admin/logout-button";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/account", label: "Account" },
  { href: "/admin/site", label: "Site" },
  { href: "/admin/hero", label: "Hero" },
  { href: "/admin/page-heroes", label: "Page heroes" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/media", label: "Galleries" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/pages", label: "Page text" },
  { href: "/admin/inquiries", label: "Inquiries" },
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
          <div className="flex flex-wrap items-center gap-4">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-xs uppercase tracking-[0.2em] text-muted hover:text-white">
                {l.label}
              </Link>
            ))}
            <Link href="/" className="text-xs uppercase tracking-[0.2em] text-muted hover:text-white">
              View site
            </Link>
            <LogoutButton />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1600px] px-6 py-12">{children}</div>
    </div>
  );
}
