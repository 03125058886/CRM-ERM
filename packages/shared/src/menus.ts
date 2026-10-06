import { moduleFor } from "./modules";

/** Views an app workspace can show, selected via ?view= */
export type WorkspaceView = "kanban" | "list" | "report" | "activity" | "stages";

export interface MenuItem {
  id: string;
  label: string;
  /** in-app view */
  view?: WorkspaceView;
  /** absolute href (another app / page) */
  href?: string;
  /** open the form view for a new record */
  newRecord?: boolean;
}
export interface Menu { id: string; label: string; items: MenuItem[] }

/** Odoo-style top menus per app. CRM has bespoke labels; every other app gets a sensible default. */
export function menusFor(appId: string): Menu[] {
  const mod = moduleFor(appId);
  const noun = mod.noun.toLowerCase();
  if (appId === "crm") {
    return [
      { id: "sales", label: "Sales", items: [
        { id: "pipeline", label: "My Pipeline", view: "kanban" },
        { id: "quotations", label: "My Quotations", href: "/dashboard/sales" },
        { id: "customers", label: "Customers", href: "/dashboard/contacts" },
      ] },
      { id: "leads", label: "Leads", items: [
        { id: "leads", label: "Leads", view: "list" },
        { id: "new", label: "New lead", newRecord: true },
      ] },
      { id: "reporting", label: "Reporting", items: [
        { id: "analysis", label: "Pipeline analysis", view: "report" },
        { id: "activity", label: "Activity", view: "activity" },
      ] },
      { id: "config", label: "Configuration", items: [
        { id: "stages", label: "Stages", view: "stages" },
        { id: "contacts", label: "Contacts", href: "/dashboard/contacts" },
        { id: "settings", label: "Settings", href: "/dashboard/settings" },
      ] },
    ];
  }
  return [
    { id: "main", label: mod.nounPlural, items: [
      { id: "kanban", label: `${mod.noun} board`, view: "kanban" },
      { id: "list", label: `All ${mod.nounPlural.toLowerCase()}`, view: "list" },
      { id: "new", label: `New ${noun}`, newRecord: true },
    ] },
    { id: "reporting", label: "Reporting", items: [
      { id: "analysis", label: `${mod.noun} analysis`, view: "report" },
      { id: "activity", label: "Activity", view: "activity" },
    ] },
    { id: "config", label: "Configuration", items: [
      { id: "stages", label: "Stages", view: "stages" },
      { id: "settings", label: "Settings", href: "/dashboard/settings" },
    ] },
  ];
}

/** Chatter entry on a record. */
export interface RecordNote {
  id: number;
  recordId: number;
  kind: "note" | "log";
  author: string;
  body: string;
  createdAt: string;
}
