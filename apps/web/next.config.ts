import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zuvora/shared"],
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: { formats: ["image/avif", "image/webp"] },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
