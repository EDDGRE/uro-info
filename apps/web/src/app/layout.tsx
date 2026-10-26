import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { getCategories, getTopics } from "@uro-info/content";

import { ThemeProvider } from "@/components/theme-provider";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { SiteDisclaimer } from "@/components/layout/site-disclaimer";

import "./globals.css";

// Self-hosted at build time (registers the real "IBM Plex …" / "Space Grotesk" @font-face
// rules), which is what content.css's --sans/--mono/--display tokens reference by name —
// and, unlike the original <link> to fonts.googleapis.com, works fully offline.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Uro Info — Klinisk urologisk oppslagsverk",
  description:
    "Klinisk oppslagsverk for leger i spesialisering i urologi: benigne og maligne tilstander, behandlingsvalg og operasjonsteknikk.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Uro Info",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#16283C",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const categories = getCategories();
  // Deliberately trimmed to just what the nav renders — not the full Topic (which
  // carries each topic's complete HTML in `indication`/`outro`). Topbar/Sidebar are
  // "use client" trees, so whatever's passed here gets serialized into *every* page's
  // hydration payload regardless of which page is open; shipping full topic HTML here
  // would undermine the Ahus-password Worker gate (worker/index.ts), which can only
  // strip Ahus-internal content from a page's own server-rendered output, not from
  // unrelated topics' data riding along in the global nav's props.
  const navTopics = getTopics().map((t) => ({
    id: t.id,
    title: t.title,
    cat: t.cat,
    status: t.status,
    ahusOnly: t.ahusOnly,
  }));

  return (
    <html lang="no" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${plexSans.className} ${plexMono.className} ${spaceGrotesk.className} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Topbar categories={categories} topics={navTopics} />
          <div className="flex min-h-[calc(100vh-56px)]">
            <Sidebar categories={categories} topics={navTopics} />
            <main className="min-w-0 flex-1 px-4 pb-24 pt-9 md:px-10">
              {children}
              <SiteDisclaimer />
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
