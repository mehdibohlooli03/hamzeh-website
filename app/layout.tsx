import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { SiteHeader } from "@/components/custom/site-header";
import { SiteFooter } from "@/components/custom/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "فروشگاه پوشاک حمزه",
  description: "خرید آنلاین پوشاک با بهترین کیفیت و قیمت",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gray-50 text-gray-900">
        <AuthProvider>
          {/* هدر سایت که در تمام صفحات تکرار می‌شود */}
          <SiteHeader />

          {/* بخش محتوای اصلی صفحات */}
          <main className="flex-1">
                      <div id="test100V" className="absolute left-1/2 top-1/2 h-px w-24 -translate-x-1/2 rotate-[-20deg] bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />

            {children}</main>

          {/* فوتر جدید سایت */}
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
