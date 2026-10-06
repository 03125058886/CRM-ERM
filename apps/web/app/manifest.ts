import type { MetadataRoute } from "next";
import { BRAND } from "@zuvora/shared";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#F6F7FB",
    theme_color: "#5B4BFF",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
