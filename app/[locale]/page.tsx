import type { Metadata } from "next";
import { CoastBar } from "@/components/CoastBar";
import { CoastHero } from "@/components/coast/CoastHero";
import { DayNight } from "@/components/coast/DayNight";
import { Journey } from "@/components/coast/Journey";
import { Drink } from "@/components/coast/Drink";
import { CatchBoard, CoastBand, DaysInCove, Gather } from "@/components/coast/sections";
import { TableCta } from "@/components/coast/TableCta";
import { getMenu, getSeasons } from "@/lib/data";
import { isLocale, type Locale } from "@/lib/i18n";
import { breadcrumbJsonLd, JsonLd, pageMetadata, restaurantJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

// Catch of the day, menu and hours come from Supabase; re-render at most once a minute.
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? pageMetadata(locale, "home") : {};
}

export default async function Home({ params }: Props) {
  const locale = (await params).locale as Locale;
  const [menu, seasons] = await Promise.all([getMenu(), getSeasons()]);
  return (
    <>
      <JsonLd data={[restaurantJsonLd(locale, seasons), breadcrumbJsonLd(locale, "home")]} />
      <CoastHero locale={locale} bar={<CoastBar locale={locale} />} />
      <Journey locale={locale} />
      <CoastBand locale={locale} />
      <DaysInCove locale={locale} />
      <Drink locale={locale} />
      <Gather locale={locale} menu={menu} />
      <DayNight locale={locale} />
      <CatchBoard locale={locale} />
      <TableCta locale={locale} />
    </>
  );
}
