import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, href, isLocale, type Locale } from "@/lib/i18n";

/**
 * Table QR codes point here (/t/4). Opens the menu in the guest's phone
 * language with the table number, so one printed code works for everyone.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  const lang = (req.headers.get("accept-language") ?? "")
    .split(",")
    .map((p) => p.split(";")[0].trim().slice(0, 2).toLowerCase())
    .find(isLocale) as Locale | undefined;
  const url = new URL(href(lang ?? defaultLocale, "menu"), req.url);
  if (/^\d{1,3}$/.test(table)) url.searchParams.set("table", table);
  return NextResponse.redirect(url, 307);
}
