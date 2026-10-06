/** Apps that every workspace has, like Odoo's Discuss / Calendar / Contacts / Settings. */
export interface SystemAppDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  /** shown before installed apps (true) or after (false) */
  leading: boolean;
}

export const SYSTEM_APPS: SystemAppDef[] = [
  { id: "discuss", name: "Discuss", icon: "MessageCircle", color: "#FF6B4A", leading: true },
  { id: "calendar", name: "Calendar", icon: "Calendar", color: "#8A7DFF", leading: true },
  { id: "contacts", name: "Contacts", icon: "BookUser", color: "#22D3A5", leading: true },
  { id: "dashboards", name: "Dashboards", icon: "LayoutDashboard", color: "#5B4BFF", leading: false },
  { id: "apps", name: "Apps", icon: "LayoutGrid", color: "#FFB020", leading: false },
  { id: "settings", name: "Settings", icon: "Settings", color: "#5A6282", leading: false },
];

export const SYSTEM_APP_IDS = new Set(SYSTEM_APPS.map((a) => a.id));

/* ---------- Discuss ---------- */
export interface Channel { id: number; name: string; description: string; createdAt: string; lastMessageAt: string | null; messageCount: number }
export interface Message { id: number; channelId: number; author: string; body: string; isBot: boolean; createdAt: string }

/* ---------- Calendar ---------- */
export interface CalendarEvent {
  id: number;
  title: string;
  /** ISO datetime */
  start: string;
  end: string;
  allDay: boolean;
  location: string;
  partner: string;
  notes: string;
  color: string;
}
export const EVENT_COLORS = ["#5B4BFF", "#FF6B4A", "#22D3A5", "#FFB020", "#8A7DFF", "#E5484D"];

/* ---------- Contacts ---------- */
export interface Contact {
  id: number;
  name: string;
  type: "person" | "company";
  company: string;
  jobTitle: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  tags: string[];
  notes: string;
  createdAt: string;
}
