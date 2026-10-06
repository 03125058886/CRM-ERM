import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BRAND } from "@zuvora/shared";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: `${BRAND.name} — Free trial`, template: `%s · ${BRAND.name}` },
  description: `${BRAND.tagline} Choose your apps and start your free ${BRAND.name} trial instantly. No credit card required.`,
  applicationName: BRAND.name,
  openGraph: { title: `${BRAND.name} — Free trial`, description: BRAND.tagline, type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#5B4BFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
