/** Zuvora brand tokens - shared by web + mobile. */
export const BRAND = {
  name: "Zuvora",
  tagline: "Run your whole business from one place.",
  domainSuffix: ".zuvora.app",
  supportEmail: "hello@zuvora.app",
  supportPhone: "+1 (555) 010-7788",
} as const;

export const COLORS = {
  // Primary: electric indigo
  primary: "#5B4BFF",
  primaryDark: "#3F2FE0",
  primaryLight: "#8A7DFF",
  primarySoft: "#ECEAFF",
  // Accent: coral
  accent: "#FF6B4A",
  accentSoft: "#FFE8E1",
  // Success: mint
  mint: "#22D3A5",
  mintSoft: "#DDFBF2",
  // Warning: amber
  amber: "#FFB020",
  // Neutrals
  midnight: "#0B0F2A",
  ink: "#1C2240",
  slate: "#5A6282",
  mist: "#9AA3C2",
  line: "#E4E7F2",
  surface: "#F6F7FB",
  white: "#FFFFFF",
  danger: "#E5484D",
} as const;

export const GRADIENTS = {
  hero: ["#5B4BFF", "#8A7DFF", "#FF6B4A"] as const,
  midnight: ["#0B0F2A", "#1C2240"] as const,
};
