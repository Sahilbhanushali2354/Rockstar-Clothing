import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";

import ThemeProvider from "./providers/ThemeProvider";
import StoreProvider from "./providers/StoreProvider";
import MetaPixel from "./components/MetaPixel";
import { themeCss } from "./theme/cssVars";
import { brand, THEME_STORAGE_KEY } from "./theme/tokens";
import { SITE_URL } from "./lib/site";

import "./globals.css";

// Both fonts are bundled locally (no build-time Google Fonts fetch).
// Body: Geist. Display headings: Space Grotesk (variable 500–700, latin).
const bodyFont = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-body",
  weight: "100 900",
  display: "swap",
});

const displayFont = localFont({
  src: "./fonts/SpaceGroteskVF-latin.woff2",
  variable: "--font-display",
  weight: "500 700",
  display: "swap",
});

const DESCRIPTION =
  "Trending streetwear, co-ord sets, graphic tees & viral drops. Order on WhatsApp, pay via UPI.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Pages set `title: "Shop all"` → "Shop all · DOPAMINE CLUB"
  title: { default: "DOPAMINE CLUB — Streetwear & viral drops", template: "%s · DOPAMINE CLUB" },
  description: DESCRIPTION,
  applicationName: "DOPAMINE CLUB",
  openGraph: {
    type: "website",
    siteName: "DOPAMINE CLUB",
    locale: "en_IN",
    title: "DOPAMINE CLUB — Streetwear & viral drops",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: brand.paper },
    { media: "(prefers-color-scheme: dark)", color: brand.ink },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Brand tokens → CSS variables, server-rendered (see app/theme). */}
        <style id="dc-tokens" dangerouslySetInnerHTML={{ __html: themeCss }} />
      </head>
      <body className="font-sans antialiased">
        {/* Applies the saved/OS theme class before first paint (no flash). */}
        <InitColorSchemeScript attribute="class" modeStorageKey={THEME_STORAGE_KEY} defaultMode="system" />
        <MetaPixel />
        <AppRouterCacheProvider>
          <ThemeProvider>
            <StoreProvider>{children}</StoreProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
