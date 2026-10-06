export interface AppDef {
  /** stable id used in DB + URLs */
  id: string;
  name: string;
  /** lucide icon name (same set exists in lucide-react and lucide-react-native) */
  icon: string;
  /** short blurb shown on hover / detail */
  blurb: string;
  /** hex colour used for icon tile */
  color: string;
}

export interface CategoryDef {
  id: string;
  name: string;
  apps: AppDef[];
}

export const CATALOG: CategoryDef[] = [
  {
    id: "website",
    name: "Website",
    apps: [
      { id: "website", name: "Website", icon: "Globe", blurb: "Drag & drop website builder.", color: "#5B4BFF" },
      { id: "ecommerce", name: "eCommerce", icon: "ShoppingBag", blurb: "Sell products online.", color: "#FF6B4A" },
      { id: "blog", name: "Blog", icon: "Rss", blurb: "Publish articles & news.", color: "#22D3A5" },
      { id: "forum", name: "Forum", icon: "MessagesSquare", blurb: "Community Q&A.", color: "#FFB020" },
      { id: "elearning", name: "eLearning", icon: "GraduationCap", blurb: "Courses & certifications.", color: "#3F2FE0" },
      { id: "events", name: "Events", icon: "CalendarDays", blurb: "Organise & sell tickets.", color: "#E5484D" },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    apps: [
      { id: "crm", name: "CRM", icon: "Handshake", blurb: "Track leads & close deals.", color: "#5B4BFF" },
      { id: "sales", name: "Sales", icon: "TrendingUp", blurb: "Quotations to orders.", color: "#22D3A5" },
      { id: "pos", name: "Point of Sale", icon: "Store", blurb: "Shop & retail POS.", color: "#FF6B4A" },
      { id: "restaurant", name: "Restaurant", icon: "UtensilsCrossed", blurb: "Tables, kitchen & bar.", color: "#FFB020" },
      { id: "subscriptions", name: "Subscriptions", icon: "Repeat", blurb: "Recurring billing.", color: "#3F2FE0" },
      { id: "rental", name: "Rental", icon: "KeyRound", blurb: "Rent out products.", color: "#E5484D" },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    apps: [
      { id: "invoicing", name: "Invoicing", icon: "Receipt", blurb: "Invoices & payments.", color: "#5B4BFF" },
      { id: "accounting", name: "Accounting", icon: "Calculator", blurb: "Full double-entry books.", color: "#22D3A5" },
      { id: "expenses", name: "Expenses", icon: "Wallet", blurb: "Employee expenses.", color: "#FF6B4A" },
      { id: "sign", name: "Sign", icon: "PenTool", blurb: "eSign documents.", color: "#FFB020" },
      { id: "equity", name: "Equity", icon: "PieChart", blurb: "Cap table & shares.", color: "#3F2FE0" },
      { id: "esg", name: "ESG", icon: "Leaf", blurb: "Sustainability reporting.", color: "#1FA37A" },
    ],
  },
  {
    id: "services",
    name: "Services",
    apps: [
      { id: "project", name: "Project", icon: "ClipboardList", blurb: "Tasks, kanban & gantt.", color: "#5B4BFF" },
      { id: "timesheets", name: "Timesheets", icon: "Timer", blurb: "Track billable hours.", color: "#22D3A5" },
      { id: "field-service", name: "Field Service", icon: "MapPin", blurb: "On-site interventions.", color: "#FF6B4A" },
      { id: "helpdesk", name: "Helpdesk", icon: "LifeBuoy", blurb: "Tickets & SLAs.", color: "#FFB020" },
      { id: "appointments", name: "Appointments", icon: "CalendarCheck", blurb: "Online booking.", color: "#3F2FE0" },
      { id: "planning", name: "Planning", icon: "CalendarRange", blurb: "Shifts & schedules.", color: "#E5484D" },
    ],
  },
  {
    id: "productivity",
    name: "Productivity",
    apps: [
      { id: "documents", name: "Documents", icon: "FolderOpen", blurb: "Files & workflows.", color: "#5B4BFF" },
      { id: "approvals", name: "Approvals", icon: "BadgeCheck", blurb: "Request & approve.", color: "#22D3A5" },
      { id: "knowledge", name: "Knowledge", icon: "BookOpen", blurb: "Wiki & notes.", color: "#FF6B4A" },
    ],
  },
  {
    id: "supply-chain",
    name: "Supply Chain",
    apps: [
      { id: "inventory", name: "Inventory", icon: "Package", blurb: "Stock & warehouses.", color: "#5B4BFF" },
      { id: "manufacturing", name: "Manufacturing", icon: "Factory", blurb: "BoMs & work orders.", color: "#22D3A5" },
      { id: "purchase", name: "Purchase", icon: "ShoppingCart", blurb: "POs & vendors.", color: "#FF6B4A" },
      { id: "maintenance", name: "Maintenance", icon: "Wrench", blurb: "Equipment upkeep.", color: "#FFB020" },
      { id: "quality", name: "Quality", icon: "ShieldCheck", blurb: "Checks & alerts.", color: "#3F2FE0" },
      { id: "repair", name: "Repair", icon: "Hammer", blurb: "Repair orders.", color: "#E5484D" },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    apps: [
      { id: "email-marketing", name: "Email Marketing", icon: "Mail", blurb: "Campaigns & automation.", color: "#5B4BFF" },
      { id: "sms-marketing", name: "SMS Marketing", icon: "MessageSquare", blurb: "Text campaigns.", color: "#22D3A5" },
      { id: "survey", name: "Survey", icon: "ListChecks", blurb: "Forms & feedback.", color: "#FF6B4A" },
      { id: "social-marketing", name: "Social Marketing", icon: "Share2", blurb: "Schedule social posts.", color: "#FFB020" },
    ],
  },
  {
    id: "hr",
    name: "Human Resources",
    apps: [
      { id: "employees", name: "Employees", icon: "Users", blurb: "People directory.", color: "#5B4BFF" },
      { id: "attendances", name: "Attendances", icon: "Fingerprint", blurb: "Check in / out.", color: "#22D3A5" },
      { id: "recruitment", name: "Recruitment", icon: "UserPlus", blurb: "Hiring pipeline.", color: "#FF6B4A" },
      { id: "time-off", name: "Time Off", icon: "Sun", blurb: "Leave management.", color: "#FFB020" },
      { id: "appraisals", name: "Appraisals", icon: "Star", blurb: "Performance reviews.", color: "#3F2FE0" },
      { id: "fleet", name: "Fleet", icon: "Car", blurb: "Vehicles & costs.", color: "#E5484D" },
      { id: "payroll", name: "Payroll", icon: "Banknote", blurb: "Payslips & taxes.", color: "#1FA37A" },
    ],
  },
  {
    id: "customization",
    name: "Customization",
    apps: [
      { id: "studio", name: "Studio", icon: "Sparkles", blurb: "No-code app builder.", color: "#5B4BFF" },
    ],
  },
];

export const ALL_APPS: AppDef[] = CATALOG.flatMap((c) => c.apps);
export const APP_BY_ID: Record<string, AppDef> = Object.fromEntries(ALL_APPS.map((a) => [a.id, a]));
export const APP_IDS: string[] = ALL_APPS.map((a) => a.id);
export const isValidAppId = (id: string): boolean => APP_IDS.includes(id);
