import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isLocale, type Locale } from "./lib/i18n";

/** "/" → best locale from Accept-Language (hr, de, else en). */
export function middleware(req: NextRequest) {
  const header = req.headers.get("accept-language") ?? "";
  const preferred = header
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
    .find(isLocale) as Locale | undefined;
  return NextResponse.redirect(new URL(`/${preferred ?? defaultLocale}`, req.url), 307);
}

export const config = { matcher: ["/"] };
