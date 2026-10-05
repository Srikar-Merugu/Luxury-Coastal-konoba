import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { OrderApp, type AppCategory, type AppCatch } from "@/components/order/OrderApp";
import { getCatchOfDay, getMenu } from "@/lib/data";
import { isLocale, type Locale } from "@/lib/i18n";
import { dishKey } from "@/lib/order";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ table: string }>; searchParams: Promise<{ lang?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const { table } = await params;
  if (!/^\d{1,3}$/.test(table) || Number(table) < 1 || Number(table) > 200) notFound();

  // language: ?lang=, else the phone's language, else English
  const q = (await searchParams).lang;
  const accept = (await headers()).get("accept-language") ?? "";
  const fromPhone = accept
    .split(",")
    .map((p) => p.split(";")[0].trim().slice(0, 2).toLowerCase())
    .find(isLocale);
  const locale: Locale = q && isLocale(q) ? q : (fromPhone as Locale | undefined) ?? "en";

  const [menu, catchOfDay] = await Promise.all([getMenu(), getCatchOfDay()]);
  const categories: AppCategory[] = menu.map((c) => ({
    id: c.id,
    name: c.name[locale],
    items: c.items.map((it, i) => ({
      key: dishKey(c.id, i),
      name: it.name[locale],
      desc: it.desc[locale],
      price: it.price,
      tags: it.tags,
      signature: Boolean(it.signature),
      photo: it.photo ?? null,
    })),
  }));
  const fresh: AppCatch = {
    headline: catchOfDay.headline[locale],
    items: catchOfDay.items.map((c) => ({ name: c.name[locale], how: c.how[locale], price: c.price, soldOut: Boolean(c.soldOut) })),
  };

  return <OrderApp locale={locale} table={table} categories={categories} fresh={fresh} />;
}
