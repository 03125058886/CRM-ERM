import Link from "next/link";
import { BRAND } from "@zuvora/shared";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="zv-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5B4BFF" />
          <stop offset="0.6" stopColor="#8A7DFF" />
          <stop offset="1" stopColor="#FF6B4A" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#zv-g)" />
      <path d="M12 28V12l16 16V12" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label={`${BRAND.name} home`}>
      <LogoMark />
      <span className={`text-[20px] font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>{BRAND.name}</span>
    </Link>
  );
}
