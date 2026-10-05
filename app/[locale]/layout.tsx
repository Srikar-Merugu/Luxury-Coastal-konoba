import fs from "node:fs";
import path from "node:path";
import type { Metadata, Viewport } from "next";
import { Cormorant, Poiret_One, Sacramento } from "next/font/google";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { Motion } from "@/components/Motion";
import { SiteDataProvider } from "@/components/SiteData";
import { getClosedOverride, getSeasons } from "@/lib/data";
import { venue } from "@/lib/content";
import { getDict } from "@/lib/dict";
import { htmlLang, isLocale, locales } from "@/lib/i18n";
import "../globals.css";

const cormorant = Cormorant({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  // Only the hero title face is preloaded; the rest swap in without competing with the hero image.
  preload: false,
});
// Thin Art Deco caps, the closest open-licence match to the reference title face.
const poiret = Poiret_One({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-poiret", display: "swap" });
const sacramento = Sacramento({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-sacramento", display: "swap", preload: false });

/**
 * Licensed brand faces. Drop the purchased web fonts into /public/fonts with
 * these names and they take over every title, nav link and script line; until
 * then the open-licence look-alikes above are used and nothing is requested.
 */
const BRAND_FONTS = [
  { file: "TanMonCheri.woff2", family: "Tan Mon Cheri", cssVar: "--font-wide", fallback: "var(--font-poiret), sans-serif" },
  { file: "GoldenHopes.woff2", family: "Golden Hopes", cssVar: "--font-script", fallback: "var(--font-sacramento), cursive" },
].filter((f) => fs.existsSync(path.join(process.cwd(), "public", "fonts", f.file)));

const brandFontCss = BRAND_FONTS.map(
  (f) => `@font-face{font-family:"${f.family}";src:url(/fonts/${f.file}) format("woff2");font-display:swap}`,
).join("") + (BRAND_FONTS.length ? `:root{${BRAND_FONTS.map((f) => `${f.cssVar}:"${f.family}",${f.fallback}`).join(";")}}` : "");

export const metadata: Metadata = {
  metadataBase: new URL(venue.url),
  applicationName: venue.name,
  openGraph: { siteName: venue.name, type: "website", images: [{ url: "/photos/hero-poster.jpg", width: 1920, height: 1080 }] },
  twitter: { card: "summary_large_image", images: ["/photos/hero-poster.jpg"] },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.replace(/[^A-Z0-9-]/gi, "");

export const viewport: Viewport = { themeColor: "#fbf8f2" };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);
  const [seasons, override] = await Promise.all([getSeasons(), getClosedOverride()]);
  return (
    <html lang={htmlLang[locale]} className={`${cormorant.variable} ${poiret.variable} ${sacramento.variable}`}>
      <body className="antialiased">
        {brandFontCss && <style dangerouslySetInnerHTML={{ __html: brandFontCss }} />}
        <a href="#main" className="sr-only z-[70] bg-ochre px-4 py-2 font-medium text-deep focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          {t.skip}
        </a>
        <SiteDataProvider value={{ seasons, override }}>
          <Header locale={locale} />
          <main id="main">{children}</main>
          <Footer locale={locale} />
        </SiteDataProvider>
        <Motion />
        <Analytics />
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            {/* Consent Mode v2: no cookies until a consent banner grants them; GA4 still gets cookieless pings. */}
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
