import {
  Globe, ShoppingBag, Rss, MessagesSquare, GraduationCap, CalendarDays,
  Handshake, TrendingUp, Store, UtensilsCrossed, Repeat, KeyRound,
  Receipt, Calculator, Wallet, PenTool, PieChart, Leaf,
  ClipboardList, Timer, MapPin, LifeBuoy, CalendarCheck, CalendarRange,
  FolderOpen, BadgeCheck, BookOpen,
  Package, Factory, ShoppingCart, Wrench, ShieldCheck, Hammer,
  Mail, MessageSquare, ListChecks, Share2,
  Users, Fingerprint, UserPlus, Sun, Star, Car, Banknote,
  Sparkles, Box, type LucideIcon,
} from "lucide-react";

/** Explicit map so only the icons we use end up in the bundle. */
export const ICONS: Record<string, LucideIcon> = {
  Globe, ShoppingBag, Rss, MessagesSquare, GraduationCap, CalendarDays,
  Handshake, TrendingUp, Store, UtensilsCrossed, Repeat, KeyRound,
  Receipt, Calculator, Wallet, PenTool, PieChart, Leaf,
  ClipboardList, Timer, MapPin, LifeBuoy, CalendarCheck, CalendarRange,
  FolderOpen, BadgeCheck, BookOpen,
  Package, Factory, ShoppingCart, Wrench, ShieldCheck, Hammer,
  Mail, MessageSquare, ListChecks, Share2,
  Users, Fingerprint, UserPlus, Sun, Star, Car, Banknote,
  Sparkles,
};

export const iconFor = (name: string): LucideIcon => ICONS[name] ?? Box;
