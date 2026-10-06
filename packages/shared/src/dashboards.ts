/** Odoo-style named dashboards: each one groups a set of apps. */
export interface DashboardDef {
  id: number;
  name: string;
  description: string;
  /** app ids included; empty = every installed app */
  apps: string[];
}

export const DASHBOARDS: DashboardDef[] = [
  { id: 1, name: "Overview", description: "Everything in your workspace at a glance.", apps: [] },
  { id: 2, name: "Sales", description: "Pipeline, orders, invoices and recurring revenue.", apps: ["crm", "sales", "pos", "restaurant", "subscriptions", "rental", "invoicing", "ecommerce"] },
  { id: 3, name: "Finance", description: "Accounting, expenses, approvals and payroll.", apps: ["accounting", "invoicing", "expenses", "approvals", "payroll", "equity", "esg"] },
  { id: 4, name: "Operations", description: "Projects, services, stock and manufacturing.", apps: ["project", "timesheets", "field-service", "helpdesk", "appointments", "planning", "inventory", "manufacturing", "purchase", "maintenance", "quality", "repair"] },
  { id: 5, name: "People", description: "Employees, hiring, time off and attendance.", apps: ["employees", "attendances", "recruitment", "time-off", "appraisals", "fleet"] },
  { id: 6, name: "Marketing", description: "Website, campaigns, events and surveys.", apps: ["website", "blog", "forum", "elearning", "events", "email-marketing", "sms-marketing", "survey", "social-marketing"] },
];

export interface StageStat { stage: string; count: number; amount: number }
export interface PartnerStat { partner: string; count: number; amount: number }
export interface AppSummary {
  appId: string;
  count: number;
  amount: number;
  /** records in the final (done) stage */
  done: number;
  byStage: StageStat[];
  topPartners: PartnerStat[];
  /** records created per day, last 14 days, oldest first */
  perDay: { day: string; count: number }[];
}
export interface DashboardSummary {
  generatedAt: string;
  apps: AppSummary[];
}
