import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { currentAdmin } from "@/lib/supabase-server";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

/** Printable QR cards, one per table. Each opens the menu in the guest's language. */
export default async function QrCards({ searchParams }: { searchParams: Promise<{ tables?: string }> }) {
  const { user, allowed } = await currentAdmin();
  if (!user || !allowed) redirect("/admin");

  const count = Math.min(60, Math.max(1, Number((await searchParams).tables) || 12));
  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const cards = await Promise.all(
    Array.from({ length: count }, async (_, i) => {
      const url = `${origin}/t/${i + 1}`;
      const svg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#17304f", light: "#0000" } });
      return { n: i + 1, url, svg };
    }),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 print:p-0">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ink-soft">Konoba Plavi Kamen</p>
          <h1 className="mt-1 text-3xl font-light text-deep">Table QR cards</h1>
          <p className="mt-2 text-sm text-ink-soft">Cut along the lines and put one on each table. The menu opens in the guest’s phone language.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-ink-soft underline">
            Back to admin
          </Link>
          <PrintButton />
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-px bg-deep/15 md:grid-cols-3 print:grid-cols-3">
        {cards.map((c) => (
          <li key={c.n} className="flex break-inside-avoid flex-col items-center bg-stone px-6 py-8 text-center text-deep">
            <p className="caps text-[1.4rem] tracking-[0.1em]">Plavi Kamen</p>
            <p className="script -mt-1 text-lg">konoba</p>
            <div className="mt-4 aspect-square w-36" dangerouslySetInnerHTML={{ __html: c.svg }} />
            <p className="mt-4 text-[0.62rem] uppercase tracking-[0.22em] text-ink-soft">Jelovnik · Menu · Speisekarte</p>
            <p className="mt-1 font-display text-2xl">Stol · Table · Tisch {c.n}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
