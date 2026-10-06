"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { APP_BY_ID, SYSTEM_APPS, type User } from "@nexora/shared";
import { iconFor } from "@/lib/icons";

interface Tile { id: string; name: string; icon: string; color: string; href: string }

/** Odoo-style home menu: system apps + installed apps on a dotted canvas. */
export function HomeMenu({ user }: { user: User }) {
  const leading = SYSTEM_APPS.filter((a) => a.leading);
  const trailing = SYSTEM_APPS.filter((a) => !a.leading);
  const tiles: Tile[] = [
    ...leading.map((a) => ({ ...a, href: `/dashboard/${a.id}` })),
    ...user.apps.map((id) => APP_BY_ID[id]).filter(Boolean).map((a) => ({ id: a.id, name: a.name, icon: a.icon, color: a.color, href: `/dashboard/${a.id}` })),
    ...trailing.map((a) => ({ ...a, href: `/dashboard/${a.id}` })),
  ];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle,#c9cde0_1px,transparent_1px)] bg-[size:18px_18px] px-4 py-8 sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-sm text-slate">{greeting}, {user.firstName}</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{user.company}</h1>
        </motion.div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
          {tiles.map((t, i) => {
            const Icon = iconFor(t.icon);
            return (
              <motion.div key={t.id} initial={{ opacity: 0, scale: 0.9, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: Math.min(i, 14) * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <Link href={t.href} className="group flex flex-col items-center gap-2.5" prefetch={false}>
                  <span className="flex size-[72px] items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-line transition-[transform,box-shadow] duration-200 group-hover:-translate-y-1 group-hover:shadow-lift group-active:scale-95">
                    <span className="flex size-12 items-center justify-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}cc)` }}>
                      <Icon className="size-6" strokeWidth={2} />
                    </span>
                  </span>
                  <span className="text-center text-[13px] font-semibold text-ink">{t.name}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
