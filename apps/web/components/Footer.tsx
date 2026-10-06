import Link from "next/link";
import { BRAND } from "@zuvora/shared";
import { Logo } from "./Logo";

const COLS: { title: string; links: string[] }[] = [
  { title: "Community", links: ["Tutorials", "Documentation", "Forum", "Certifications", "Events"] },
  { title: "Services", links: ["Find a partner", "Become a partner", "Hosting", "Support", "Upgrade"] },
  { title: "Company", links: ["About us", "Careers", "Contact", "Legal", "Privacy"] },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-slate">{BRAND.tagline} One login, one database, 46 integrated apps.</p>
          <p className="mt-4 text-sm text-slate">
            <span className="font-medium text-ink">Need help?</span> {BRAND.supportPhone}
            <br />
            <a className="btn-link mt-1" href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h4 className="text-sm font-semibold text-ink">{c.title}</h4>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l}>
                  <Link href="#" className="text-sm text-slate transition-colors hover:text-primary">{l}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-mist sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</span>
          <span className="flex gap-4">
            <Link href="#" className="hover:text-primary">Subscription Agreement</Link>
            <Link href="#" className="hover:text-primary">Privacy Policy</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
