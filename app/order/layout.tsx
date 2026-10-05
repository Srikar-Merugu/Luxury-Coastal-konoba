import type { Metadata, Viewport } from "next";
import { Cormorant, Poiret_One, Sacramento } from "next/font/google";
import "../globals.css";

const cormorant = Cormorant({ subsets: ["latin", "latin-ext"], weight: ["400", "500"], variable: "--font-cormorant", display: "swap" });
const poiret = Poiret_One({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-poiret", display: "swap" });
const sacramento = Sacramento({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-sacramento", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Order · Konoba Plavi Kamen",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#0b5f6e", width: "device-width", initialScale: 1, viewportFit: "cover" };

/** Ordering from the table: an app-like page with no site header, footer or animations. */
export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${poiret.variable} ${sacramento.variable}`}>
      <body className="min-h-screen bg-stone font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
