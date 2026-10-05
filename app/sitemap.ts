import type { MetadataRoute } from "next";
import { venue } from "@/lib/content";
import { defaultLocale, href, htmlLang, locales, pageKeys } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  return pageKeys.flatMap((page) =>
    locales.map((locale) => ({
      url: `${venue.url}${href(locale, page)}`,
      changeFrequency: page === "home" || page === "menu" ? ("daily" as const) : ("monthly" as const),
      priority: page === "home" ? 1 : 0.7,
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((l) => [htmlLang[l], `${venue.url}${href(l, page)}`])),
          "x-default": `${venue.url}${href(defaultLocale, page)}`,
        },
      },
    })),
  );
}
