import type { Metadata } from "next";
import { Cormorant, Poiret_One, Sacramento } from "next/font/google";
import "../globals.css";

// Brand faces for the printable QR cards; the admin itself uses the system UI font.
const cormorant = Cormorant({ subsets: ["latin", "latin-ext"], weight: ["400"], variable: "--font-cormorant", display: "swap", preload: false });
const poiret = Poiret_One({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-poiret", display: "swap", preload: false });
const sacramento = Sacramento({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-sacramento", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Admin · Konoba Plavi Kamen",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${poiret.variable} ${sacramento.variable}`}>
      <body className="min-h-screen bg-stone font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
