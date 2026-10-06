"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, LogOut, Settings } from "lucide-react";
import { BRAND, type User } from "@nexora/shared";
import { Logo } from "@/components/Logo";
import { signOut } from "@/lib/api";
import { useToast } from "@/components/Toast";

const LINKS = [
  { href: "/dashboard", label: "Apps", icon: LayoutGrid },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardNav({ user }: { user: User }) {
  const path = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  async function logout() {
    await signOut();
    toast("Signed out. See you soon!", "info");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-line">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Logo href="/dashboard" />
        <span className="hidden rounded-full bg-primary-soft px-2.5 py-1 font-mono text-xs text-primary sm:inline">{user.subdomain}{BRAND.domainSuffix}</span>
        <nav className="ml-auto flex items-center gap-1">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link key={l.href} href={l.href} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-primary text-white" : "text-slate hover:bg-primary-soft hover:text-primary"}`}>
                <l.icon className="size-4" /> <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
          <span className="mx-2 hidden h-6 w-px bg-line sm:block" />
          <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white" title={`${user.firstName} ${user.lastName}`}>{initials}</span>
          <button onClick={logout} className="rounded-xl p-2 text-slate transition-colors hover:bg-danger/10 hover:text-danger" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </button>
        </nav>
      </div>
    </header>
  );
}
