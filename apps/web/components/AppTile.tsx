"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { AppDef } from "@zuvora/shared";
import { iconFor } from "@/lib/icons";

interface Props {
  app: AppDef;
  selected: boolean;
  onToggle: (id: string) => void;
  index?: number;
}

export const AppTile = memo(function AppTile({ app, selected, onToggle, index = 0 }: Props) {
  const Icon = iconFor(app.icon);
  return (
    <motion.button
      type="button"
      onClick={() => onToggle(app.id)}
      aria-pressed={selected}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className={`group relative flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition-[border-color,box-shadow,background-color] duration-200 ${
        selected
          ? "border-primary bg-primary-soft/60 shadow-glow"
          : "border-line hover:border-primary-light hover:shadow-soft"
      }`}
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105"
        style={{ background: `linear-gradient(135deg, ${app.color}, ${app.color}cc)` }}
      >
        <Icon className="size-5" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-ink">{app.name}</span>
        <span className="block truncate text-xs text-slate">{app.blurb}</span>
      </span>
      <motion.span
        initial={false}
        animate={{ scale: selected ? 1 : 0.6, opacity: selected ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
        className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-white shadow-soft"
      >
        <Check className="size-3.5" strokeWidth={3} />
      </motion.span>
    </motion.button>
  );
});
