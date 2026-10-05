export const locales = ["hr", "en", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const pageKeys = ["home", "menu", "book", "visit", "about", "faq"] as const;
export type PageKey = (typeof pageKeys)[number];

// Translated slugs per locale (home has no slug).
export const slugs: Record<Locale, Record<Exclude<PageKey, "home">, string>> = {
  hr: { menu: "jelovnik", book: "rezervacija", visit: "kako-do-nas", about: "o-nama", faq: "pitanja" },
  en: { menu: "menu", book: "book", visit: "visit", about: "about", faq: "faq" },
  de: { menu: "speisekarte", book: "reservieren", visit: "anfahrt", about: "ueber-uns", faq: "faq" },
};

export const localeNames: Record<Locale, string> = { hr: "Hrvatski", en: "English", de: "Deutsch" };
export const htmlLang: Record<Locale, string> = { hr: "hr-HR", en: "en", de: "de" };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function href(locale: Locale, page: PageKey): string {
  return page === "home" ? `/${locale}` : `/${locale}/${slugs[locale][page]}`;
}

export function pageFromSlug(locale: Locale, slug: string): PageKey | null {
  const entry = Object.entries(slugs[locale]).find(([, s]) => s === slug);
  return entry ? (entry[0] as PageKey) : null;
}

/** hreflang alternates for a page, used in metadata. */
export function alternates(page: PageKey, current: Locale) {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[htmlLang[l]] = href(l, page);
  languages["x-default"] = href(defaultLocale, page);
  return { canonical: href(current, page), languages };
}
