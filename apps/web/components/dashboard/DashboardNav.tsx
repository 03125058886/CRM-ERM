"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Grip, Home, LayoutDashboard, LayoutGrid, LogOut, Settings } from "lucide-react";
import { APP_BY_ID, BRAND, SYSTEM_APPS, type User } from "@zuvora/shared";
import { Logo } from "@/components/Logo";
import { iconFor } from "@/lib/icons";
import { signOut } from "@/lib/api";
import { useToast } from "@/components/Toast";

const LINKS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/dashboards", label: "Dashboards", icon: LayoutDashboard },
  { href: "/dashboard/apps", label: "Apps", icon: LayoutGrid },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardNav({ user }: { user: User }) {
  const path = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [switcher, setSwitcher] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  const seg = path.split("/")[2] ?? "";
  const currentApp = APP_BY_ID[seg] ?? SYSTEM_APPS.find((a) => a.id === seg);

  useEffect(() => { setSwitcher(false); }, [path]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setSwitcher(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function logout() {
    await signOut();
    toast("Signed out. See you soon!", "info");
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-line">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* App switcher (Odoo-style home menu) */}
        <div ref={ref} className="relative">
          <button onClick={() => setSwitcher((v) => !v)} className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold transition-colors ${switcher ? "bg-primary text-white" : "text-ink hover:bg-primary-soft"}`} aria-haspopup="menu" aria-expanded={switcher}>
            <Grip className="size-5" />
            {currentApp && <span className="hidden sm:inline">{currentApp.name}</span>}
          </button>
          <AnimatePresence>
            {switcher && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.18 }}
                className="absolute left-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white p-3 shadow-lift" role="menu"
              >
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-mist">Your apps</p>
                <div className="grid max-h-80 grid-cols-4 gap-1 overflow-y-auto">
                  {[...SYSTEM_APPS.filter((a) => a.leading), ...user.apps.map((id) => APP_BY_ID[id]).filter(Boolean), ...SYSTEM_APPS.filter((a) => !a.leading)].map((app) => {
                    const id = app.id;
                    const Icon = iconFor(app.icon);
                    return (
                      <Link key={id} href={`/dashboard/${id}`} role="menuitem" className={`flex flex-col items-center gap-1.5 rounded-xl p-2 text-center transition-colors hover:bg-primary-soft ${currentApp?.id === id ? "bg-primary-soft" : ""}`}>
                        <span className="flex size-10 items-center justify-center rounded-xl text-white" style={{ background: app.color }}><Icon className="size-5" /></span>
                        <span className="line-clamp-1 text-[11px] font-medium text-ink">{app.name}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-2 flex gap-1 border-t border-line pt-2">
                  <Link href="/dashboard" className="flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-medium text-slate hover:bg-surface hover:text-ink">All apps</Link>
                  <Link href="/dashboard/dashboards" className="flex-1 rounded-lg px-2 py-1.5 text-center text-xs font-medium text-slate hover:bg-surface hover:text-ink">Dashboards</Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Logo href="/dashboard" />
        <span className="hidden rounded-full bg-primary-soft px-2.5 py-1 font-mono text-xs text-primary lg:inline">{user.subdomain}{BRAND.domainSuffix}</span>

        <nav className="ml-auto flex items-center gap-1">
          {LINKS.map((l) => {
            const active = l.href === "/dashboard" ? path === l.href : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-primary text-white" : "text-slate hover:bg-primary-soft hover:text-primary"}`}>
                <l.icon className="size-4" /> <span className="hidden md:inline">{l.label}</span>
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
