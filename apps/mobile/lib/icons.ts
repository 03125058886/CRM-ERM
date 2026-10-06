import {
  Globe, ShoppingBag, Rss, MessagesSquare, GraduationCap, CalendarDays,
  Handshake, TrendingUp, Store, UtensilsCrossed, Repeat, KeyRound,
  Receipt, Calculator, Wallet, PenTool, PieChart, Leaf,
  ClipboardList, Timer, MapPin, LifeBuoy, CalendarCheck, CalendarRange,
  FolderOpen, BadgeCheck, BookOpen,
  Package, Factory, ShoppingCart, Wrench, ShieldCheck, Hammer,
  Mail, MessageSquare, ListChecks, Share2,
  Users, Fingerprint, UserPlus, Sun, Star, Car, Banknote,
  Sparkles, Box, MessageCircle, Calendar, BookUser, LayoutDashboard, LayoutGrid, Settings, type LucideIcon,
} from "lucide-react-native";

export const ICONS: Record<string, LucideIcon> = {
  Globe, ShoppingBag, Rss, MessagesSquare, GraduationCap, CalendarDays,
  Handshake, TrendingUp, Store, UtensilsCrossed, Repeat, KeyRound,
  Receipt, Calculator, Wallet, PenTool, PieChart, Leaf,
  ClipboardList, Timer, MapPin, LifeBuoy, CalendarCheck, CalendarRange,
  FolderOpen, BadgeCheck, BookOpen,
  Package, Factory, ShoppingCart, Wrench, ShieldCheck, Hammer,
  Mail, MessageSquare, ListChecks, Share2,
  Users, Fingerprint, UserPlus, Sun, Star, Car, Banknote,
  Sparkles, MessageCircle, Calendar, BookUser, LayoutDashboard, LayoutGrid, Settings,
};

export const iconFor = (name: string): LucideIcon => ICONS[name] ?? Box;
