import { Router } from "express";
import { moduleFor, type AppSummary, type DashboardSummary } from "@zuvora/shared";
import { db } from "./db.js";
import { requireAuth, currentUser } from "./auth.js";
import { ensureSeeded } from "./records.js";
import { stagesFor } from "./workdb.js";

export const dashboards = Router();
dashboards.use(requireAuth);

const stmts = {
  byStage: db.prepare("SELECT stage, COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount FROM records WHERE user_id = ? AND app_id = ? GROUP BY stage"),
  byPartner: db.prepare("SELECT partner, COUNT(*) AS count, COALESCE(SUM(amount),0) AS amount FROM records WHERE user_id = ? AND app_id = ? AND partner <> '' GROUP BY partner ORDER BY amount DESC, count DESC LIMIT 5"),
  perDay: db.prepare("SELECT substr(created_at,1,10) AS day, COUNT(*) AS count FROM records WHERE user_id = ? AND app_id = ? AND created_at >= datetime('now','-14 days') GROUP BY day"),
};

/** GET /dashboards/summary — aggregated stats for every installed app (used by all dashboards). */
dashboards.get("/summary", (req, res) => {
  const u = currentUser(req);
  const installed = JSON.parse(u.apps) as string[];
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) days.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));

  const apps: AppSummary[] = installed.map((appId) => {
    ensureSeeded(u.id, appId);
    const mod = moduleFor(appId);
    const rows = stmts.byStage.all(u.id, appId) as unknown as { stage: string; count: number; amount: number }[];
    const map = new Map(rows.map((r) => [r.stage, r]));
    const stages = stagesFor(u.id, appId);
    const byStage = stages.map((stage) => ({ stage, count: Number(map.get(stage)?.count ?? 0), amount: Number(map.get(stage)?.amount ?? 0) }));
    const lastStage = stages[stages.length - 1];
    const perDayRows = stmts.perDay.all(u.id, appId) as unknown as { day: string; count: number }[];
    const perDayMap = new Map(perDayRows.map((r) => [r.day, Number(r.count)]));
    return {
      appId,
      count: byStage.reduce((s, x) => s + x.count, 0),
      amount: mod.amountLabel ? byStage.reduce((s, x) => s + x.amount, 0) : 0,
      done: byStage.find((x) => x.stage === lastStage)?.count ?? 0,
      byStage,
      topPartners: (stmts.byPartner.all(u.id, appId) as unknown as { partner: string; count: number; amount: number }[]).map((p) => ({ partner: p.partner, count: Number(p.count), amount: Number(p.amount) })),
      perDay: days.map((day) => ({ day, count: perDayMap.get(day) ?? 0 })),
    };
  });

  const payload: DashboardSummary = { generatedAt: new Date().toISOString(), apps };
  res.json(payload);
});
