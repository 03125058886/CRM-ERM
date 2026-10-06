"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, LayoutDashboard, RefreshCw } from "lucide-react";
import { APP_BY_ID, DASHBOARDS, moduleFor, type AppSummary, type DashboardSummary } from "@nexora/shared";
import { api, ApiError } from "@/lib/api";
import { iconFor } from "@/lib/icons";
import { useToast } from "@/components/Toast";

const fmt = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
const BAR = "#5B4BFF";

/* ---------- Horizontal bar list (single measure, one hue) ---------- */
function BarList({ rows, valueLabel }: { rows: { key: string; label: string; value: number; href?: string; color?: string }[]; valueLabel: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const [hover, setHover] = useState<string | null>(null);
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-mist">No data yet.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.key} className="group relative flex items-center gap-3 text-sm" onMouseEnter={() => setHover(r.key)} onMouseLeave={() => setHover(null)}>
          <span className="w-32 shrink-0 truncate text-slate">{r.href ? <Link href={r.href} className="hover:text-primary">{r.label}</Link> : r.label}</span>
          <span className="relative h-5 flex-1 rounded-r-[4px] bg-surface">
            <motion.span
              initial={{ width: 0 }} animate={{ width: `${(r.value / max) * 100}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-y-0 left-0 rounded-r-[4px]" style={{ background: r.color ?? BAR }}
            />
          </span>
          <span className="w-16 shrink-0 text-right tabular-nums text-ink">{fmt(r.value)}</span>
          {hover === r.key && (
            <span className="pointer-events-none absolute -top-8 left-32 z-10 rounded-lg bg-midnight px-2.5 py-1 text-xs text-white shadow-lift">{r.label}: {fmt(r.value)} {valueLabel}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ---------- Vertical column chart for stages ---------- */
function StageChart({ stages, measure }: { stages: { stage: string; count: number; amount: number }[]; measure: "count" | "amount" }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 320, H = 120, PAD = 4, gap = 2;
  const max = Math.max(1, ...stages.map((s) => s[measure]));
  const bw = (W - PAD * 2) / stages.length;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="h-auto w-full" role="img" aria-label="Records by stage">
        <line x1={PAD} x2={W - PAD} y1={H} y2={H} stroke="#E4E7F2" strokeWidth="1" />
        {stages.map((s, i) => {
          const v = s[measure];
          const h = Math.max(v > 0 ? 4 : 0, (v / max) * (H - 10));
          const x = PAD + i * bw + gap;
          const w = Math.max(6, Math.min(28, bw - gap * 2));
          const cx = PAD + i * bw + bw / 2;
          return (
            <g key={s.stage} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={PAD + i * bw} y={0} width={bw} height={H} fill="transparent" />
              <rect x={cx - w / 2} y={H - h} width={w} height={h} rx={4} ry={4} fill={BAR} opacity={hover === null || hover === i ? 1 : 0.45} />
              {/* square off the bottom so the rounded end sits at the top only */}
              {h > 4 && <rect x={cx - w / 2} y={H - 4} width={w} height={4} fill={BAR} opacity={hover === null || hover === i ? 1 : 0.45} />}
              <text x={cx} y={H + 16} textAnchor="middle" fontSize="10" fill="#5A6282">{s.stage.length > 9 ? s.stage.slice(0, 8) + "…" : s.stage}</text>
              <text x={x} y={H - h - 4} fontSize="0" />
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg bg-midnight px-2.5 py-1 text-xs text-white shadow-lift">
          {stages[hover].stage}: {fmt(stages[hover][measure])} {measure === "amount" ? "" : "records"}
        </div>
      )}
    </div>
  );
}

/* ---------- Sparkline (records created per day) ---------- */
function Sparkline({ points, color = BAR }: { points: { day: string; count: number }[]; color?: string }) {
  const W = 120, H = 32;
  const max = Math.max(1, ...points.map((p) => p.count));
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * W},${H - 2 - (p.count / max) * (H - 4)}`).join(" ");
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-8 w-28" aria-label="Last 14 days">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={W} cy={H - 2 - (last.count / max) * (H - 4)} r="3" fill={color} stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-bold text-ink">{title}</h3>{action}</div>
      {children}
    </section>
  );
}

export function Dashboards({ installed }: { installed: string[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = Number(params.get("dashboard_id") ?? 1);
  const dash = DASHBOARDS.find((d) => d.id === id) ?? DASHBOARDS[0];
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setData(await api<DashboardSummary>("/dashboards/summary")); }
    catch (e) { toast((e as ApiError).message, "error"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apps: AppSummary[] = useMemo(() => {
    const list = data?.apps ?? [];
    return dash.apps.length ? list.filter((a) => dash.apps.includes(a.appId)) : list;
  }, [data, dash]);

  const totals = useMemo(() => ({
    records: apps.reduce((s, a) => s + a.count, 0),
    done: apps.reduce((s, a) => s + a.done, 0),
    amount: apps.reduce((s, a) => s + a.amount, 0),
    apps: apps.length,
  }), [apps]);

  const missing = dash.apps.filter((a) => !installed.includes(a)).length;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-4">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-soft"><LayoutDashboard className="size-6" /></span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{dash.name} dashboard</h1>
          <p className="text-sm text-slate">{dash.description}</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost !px-3" aria-label="Refresh"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /></button>
      </motion.div>

      {/* Dashboard switcher */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {DASHBOARDS.map((d) => (
          <button key={d.id} onClick={() => router.replace(`/dashboard/dashboards?dashboard_id=${d.id}`)} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${d.id === dash.id ? "border-primary bg-primary text-white" : "border-line bg-white text-slate hover:border-primary-light hover:text-primary"}`}>
            {d.name}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Records", value: fmt(totals.records) },
          { label: "Completed", value: fmt(totals.done) },
          { label: "Total value", value: fmt(totals.amount) },
          { label: "Apps", value: String(totals.apps) },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl border border-line bg-white p-4 shadow-soft">
            <p className="text-xs font-medium uppercase tracking-wider text-mist">{k.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{data ? k.value : "–"}</p>
          </motion.div>
        ))}
      </div>

      {!data ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-56 shimmer rounded-2xl" />)}</div>
      ) : apps.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-12 text-center text-slate">
          None of the {dash.name} apps are installed yet. <Link href="/dashboard" className="btn-link">Add apps</Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card title="Records by app">
              <BarList valueLabel="records" rows={apps.map((a) => ({ key: a.appId, label: APP_BY_ID[a.appId].name, value: a.count, href: `/dashboard/${a.appId}` }))} />
            </Card>
            <Card title="Total value by app">
              <BarList valueLabel="" rows={apps.filter((a) => moduleFor(a.appId).amountLabel).map((a) => ({ key: a.appId, label: APP_BY_ID[a.appId].name, value: a.amount, href: `/dashboard/${a.appId}` }))} />
            </Card>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {apps.map((a, i) => {
              const app = APP_BY_ID[a.appId];
              const mod = moduleFor(a.appId);
              const Icon = iconFor(app.icon);
              return (
                <motion.section key={a.appId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="rounded-2xl border border-line bg-white p-5 shadow-soft">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl text-white" style={{ background: app.color }}><Icon className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/dashboard/${a.appId}`} className="flex items-center gap-1 text-sm font-bold text-ink hover:text-primary">{app.name} <ArrowUpRight className="size-3.5 text-mist" /></Link>
                      <p className="text-xs text-slate">{fmt(a.count)} {mod.nounPlural.toLowerCase()} · {fmt(a.done)} {mod.stages[mod.stages.length - 1].toLowerCase()}</p>
                    </div>
                    <Sparkline points={a.perDay} color={app.color} />
                  </div>
                  <div className="mt-4">
                    <StageChart stages={a.byStage} measure="count" />
                  </div>
                  {a.topPartners.length > 0 && (
                    <div className="mt-3 border-t border-line pt-3">
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-mist">Top {mod.partnerLabel?.toLowerCase() ?? "partners"}</p>
                      <ul className="space-y-1 text-xs">
                        {a.topPartners.slice(0, 3).map((p) => (
                          <li key={p.partner} className="flex justify-between"><span className="truncate text-slate">{p.partner}</span><span className="tabular-nums text-ink">{mod.amountLabel ? fmt(p.amount) : `${p.count}`}</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.section>
              );
            })}
          </div>
          {missing > 0 && <p className="mt-4 text-xs text-mist">{missing} more {dash.name} app{missing > 1 ? "s" : ""} available. <Link href="/dashboard" className="text-primary hover:underline">Install</Link></p>}
        </>
      )}
    </>
  );
}
