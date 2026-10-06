import { COLORS } from "@zuvora/shared";

export const C = COLORS;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const space = (n: number) => n * 4;

export const shadow = {
  soft: {
    shadowColor: "#0B0F2A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  lift: {
    shadowColor: "#5B4BFF",
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;

export const font = {
  h1: { fontSize: 30, fontWeight: "800" as const, letterSpacing: -0.6, color: C.ink },
  h2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3, color: C.ink },
  h3: { fontSize: 17, fontWeight: "700" as const, color: C.ink },
  body: { fontSize: 15, color: C.ink },
  muted: { fontSize: 13, color: C.slate },
  tiny: { fontSize: 11, color: C.mist, fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: 0.8 },
};
