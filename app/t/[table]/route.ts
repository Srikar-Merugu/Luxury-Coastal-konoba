import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/lib/i18n";

/**
 * Table QR codes point here (/t/4) and open the table's ordering page in
 * the guest's phone language, so one printed code works for everyone.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  if (!/^\d{1,3}$/.test(table)) return NextResponse.redirect(new URL("/", req.url), 307);
  const lang = (req.headers.get("accept-language") ?? "")
    .split(",")
    .map((p) => p.split(";")[0].trim().slice(0, 2).toLowerCase())
    .find(isLocale);
  return NextResponse.redirect(new URL(`/order/${table}${lang ? `?lang=${lang}` : ""}`, req.url), 307);
}
