import type { Metadata } from "next";
import { faqs, menu, seasons, venue } from "./content";
import { getDict } from "./dict";
import { alternates, href, htmlLang, type Locale, type PageKey } from "./i18n";

export function pageMetadata(locale: Locale, page: PageKey): Metadata {
  const m = getDict(locale).meta[page];
  return {
    title: m.title,
    description: m.description,
    alternates: alternates(page, locale),
    openGraph: { title: m.title, description: m.description, url: href(locale, page), locale: htmlLang[locale] },
    twitter: { title: m.title, description: m.description },
  };
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function restaurantJsonLd(locale: Locale) {
  const year = new Date().getFullYear();
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${venue.url}/#restaurant`,
    name: venue.name,
    url: `${venue.url}${href(locale, "home")}`,
    telephone: venue.phone,
    email: venue.email,
    priceRange: venue.priceRange,
    servesCuisine: ["Croatian", "Seafood", "Mediterranean"],
    acceptsReservations: `${venue.url}${href(locale, "book")}`,
    hasMenu: `${venue.url}${href(locale, "menu")}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.street,
      postalCode: venue.postalCode,
      addressLocality: venue.locality,
      addressRegion: venue.region,
      addressCountry: venue.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: venue.geo.lat, longitude: venue.geo.lng },
    openingHoursSpecification: seasons.flatMap((s) =>
      Object.entries(s.hours)
        .filter(([, h]) => h)
        .map(([d, h]) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: dayNames[Number(d)],
          opens: h![0],
          closes: h![1] === "24:00" ? "23:59" : h![1],
          validFrom: `${year}-${s.from}`,
          validThrough: `${year}-${s.to}`,
        })),
    ),
  };
}

export function menuJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Menu",
    inLanguage: htmlLang[locale],
    hasMenuSection: menu.map((c) => ({
      "@type": "MenuSection",
      name: c.name[locale],
      hasMenuItem: c.items.map((i) => ({
        "@type": "MenuItem",
        name: i.name[locale],
        description: i.desc[locale],
        offers: { "@type": "Offer", price: i.price.replace("/kg", ""), priceCurrency: "EUR" },
        ...(i.tags.includes("vegan") && { suitableForDiet: "https://schema.org/VeganDiet" }),
        ...(i.tags.includes("gluten-free") && !i.tags.includes("vegan") && { suitableForDiet: "https://schema.org/GlutenFreeDiet" }),
      })),
    })),
  };
}

export function faqJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q[locale],
      acceptedAnswer: { "@type": "Answer", text: f.a[locale] },
    })),
  };
}

export function breadcrumbJsonLd(locale: Locale, page: PageKey) {
  const t = getDict(locale).nav;
  const items = [{ name: t.home, url: href(locale, "home") }];
  if (page !== "home") items.push({ name: t[page], url: href(locale, page) });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${venue.url}${it.url}` })),
  };
}

export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
