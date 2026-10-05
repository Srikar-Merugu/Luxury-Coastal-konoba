import type { Metadata } from "next";
import { CoastHero } from "@/components/coast/CoastHero";
import { DayNight } from "@/components/coast/DayNight";
import { Journey } from "@/components/coast/Journey";
import { Drink } from "@/components/coast/Drink";
import { CatchBoard, CoastBand, DaysInCove, Gather } from "@/components/coast/sections";
import { TableCta } from "@/components/coast/TableCta";
import { getMenu } from "@/lib/data";
import { isLocale, type Locale } from "@/lib/i18n";
import { breadcrumbJsonLd, JsonLd, pageMetadata, restaurantJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? pageMetadata(locale, "home") : {};
}

export default async function Home({ params }: Props) {
  const locale = (await params).locale as Locale;
  const menu = await getMenu();
  return (
    <>
      <JsonLd data={[restaurantJsonLd(locale), breadcrumbJsonLd(locale, "home")]} />
      <CoastHero locale={locale} />
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
