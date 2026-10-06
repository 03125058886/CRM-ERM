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
  if (appId === "sales") {
    return [
      { id: "orders", label: "Orders", items: [
        { id: "quotations", label: "Quotations", view: "kanban" },
        { id: "orders", label: "Orders", view: "list" },
        { id: "new", label: "New quotation", newRecord: true },
        { id: "customers", label: "Customers", href: "/dashboard/contacts" },
      ] },
      { id: "invoice", label: "To Invoice", items: [
        { id: "to-invoice", label: "Orders to invoice", view: "list" },
        { id: "invoices", label: "Invoices", href: "/dashboard/invoicing" },
      ] },
      { id: "products", label: "Products", items: [
        { id: "products", label: "Products", href: "/dashboard/ecommerce" },
        { id: "pricelists", label: "Pricelists", href: "/dashboard/ecommerce" },
      ] },
      { id: "reporting", label: "Reporting", items: [
        { id: "analysis", label: "Sales analysis", view: "report" },
        { id: "activity", label: "Activity", view: "activity" },
      ] },
      { id: "config", label: "Configuration", items: [
        { id: "stages", label: "Stages", view: "stages" },
        { id: "settings", label: "Settings", href: "/dashboard/settings" },
      ] },
    ];
  }
  if (appId === "invoicing") {
    return [
      { id: "customers", label: "Customers", items: [
        { id: "invoices", label: "Invoices", view: "list" },
        { id: "new", label: "New invoice", newRecord: true },
        { id: "board", label: "Invoice board", view: "kanban" },
        { id: "customers", label: "Customers", href: "/dashboard/contacts" },
      ] },
      { id: "vendors", label: "Vendors", items: [
        { id: "bills", label: "Bills", href: "/dashboard/purchase" },
        { id: "vendors", label: "Vendors", href: "/dashboard/contacts" },
      ] },
      { id: "accounting", label: "Accounting", items: [
        { id: "journals", label: "Journal entries", href: "/dashboard/accounting" },
        { id: "expenses", label: "Expenses", href: "/dashboard/expenses" },
      ] },
      { id: "reporting", label: "Reporting", items: [
        { id: "analysis", label: "Invoice analysis", view: "report" },
        { id: "activity", label: "Activity", view: "activity" },
      ] },
      { id: "config", label: "Configuration", items: [
        { id: "stages", label: "Stages", view: "stages" },
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
