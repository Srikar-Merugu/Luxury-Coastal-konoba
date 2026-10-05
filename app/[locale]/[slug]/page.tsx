import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import { CoastBar } from "@/components/CoastBar";
import { Hours } from "@/components/Hours";
import { Pic } from "@/components/Pic";
import { BookingCta, Directions, FaqList, MenuList, PageHero } from "@/components/sections";
import { venue } from "@/lib/content";
import { getFaqs, getMenu, getSeasons } from "@/lib/data";
import { getDict } from "@/lib/dict";
import { isLocale, locales, pageFromSlug, slugs, type Locale, type PageKey } from "@/lib/i18n";
import { breadcrumbJsonLd, faqJsonLd, JsonLd, menuJsonLd, pageMetadata, restaurantJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

export const dynamicParams = false;
// Menu, hours and FAQ come from Supabase; re-render at most once a minute.
export const revalidate = 60;

export function generateStaticParams() {
  return locales.flatMap((locale) => Object.values(slugs[locale]).map((slug) => ({ locale, slug })));
}

function resolve(locale: string, slug: string): [Locale, PageKey] | null {
  if (!isLocale(locale)) return null;
  const page = pageFromSlug(locale, slug);
  return page ? [locale, page] : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const r = resolve(locale, slug);
  return r ? pageMetadata(r[0], r[1]) : {};
}

export default async function Page({ params }: Props) {
  const { locale: l, slug } = await params;
  const r = resolve(l, slug);
  if (!r) notFound();
  const [locale, page] = r;
  const t = getDict(locale);
  const crumbs = breadcrumbJsonLd(locale, page);

  switch (page) {
    case "menu": {
      const menu = await getMenu();
      return (
        <>
          <JsonLd data={[menuJsonLd(locale, menu), crumbs]} />
          <PageHero locale={locale} photo="grill" eyebrow={t.menuPage.eyebrow} title={t.menuPage.title} intro={t.menuPage.intro} />
          <MenuList locale={locale} menu={menu} />
          <BookingCta locale={locale} />
        </>
      );
    }
    case "book":
      return (
        <>
          <JsonLd data={crumbs} />
          <PageHero locale={locale} photo="terrace" eyebrow={t.book.eyebrow} title={t.book.title} intro={t.book.intro} />
          <div className="container-k grid gap-12 py-20 md:py-28 lg:grid-cols-12">
            <aside className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <Pic name="bluehour" locale={locale} clip className="hidden aspect-[4/5] w-full lg:block" sizes="30vw" />
                <p className="mt-6 font-display text-2xl leading-snug text-deep">{venue.name}</p>
                <p className="mt-2 text-ink-soft">
                  {venue.street}, {venue.locality}, {venue.island}
                </p>
                <a href={`tel:${venue.phoneHref}`} className="mt-2 inline-block text-ink underline decoration-ochre underline-offset-4">
                  {venue.phone}
                </a>
              </div>
            </aside>
            <div className="lg:col-span-7 lg:col-start-6">
              <BookingForm locale={locale} />
            </div>
          </div>
        </>
      );
    case "visit": {
      const seasons = await getSeasons();
      return (
        <>
          <JsonLd data={[restaurantJsonLd(locale, seasons), crumbs]} />
          <PageHero locale={locale} photo="aerial" eyebrow={t.visit.eyebrow} title={t.visit.title} />
          <Directions locale={locale} />
          <Hours locale={locale} extra={<CoastBar locale={locale} />} />
          <BookingCta locale={locale} photo="terrace" />
        </>
      );
    }
    case "about":
      return (
        <>
          <JsonLd data={crumbs} />
          <PageHero locale={locale} photo="house" eyebrow={t.about.eyebrow} title={t.about.title} />
          <section className="container-k grid gap-12 py-24 md:py-36 lg:grid-cols-12">
            <p className="font-display text-[clamp(2rem,3.6vw,3.6rem)] leading-[1.08] text-deep lg:col-span-9" data-scrub-words>
              {t.about.paragraphs[0]}
            </p>
          </section>
          <section className="container-k grid items-center gap-12 pb-24 md:pb-36 lg:grid-cols-12">
            <Pic name="boat" locale={locale} clip parallax={0.08} className="aspect-[4/5] w-full lg:col-span-5" sizes="(max-width: 1024px) 100vw, 40vw" />
            <div className="space-y-6 text-[1.08rem] leading-relaxed text-ink-soft lg:col-span-5 lg:col-start-8">
              {t.about.paragraphs.slice(1).map((p, i) => (
                <p key={i} data-reveal>
                  {p}
                </p>
              ))}
            </div>
          </section>
          <section className="bg-stone-2 py-24 md:py-32">
            <ul className="container-k grid gap-10 md:grid-cols-3">
              {t.about.people.map((p, i) => (
                <li key={p.name} data-reveal={String(i * 0.1)}>
                  <Pic name={(["hands", "grill", "grove"] as const)[i]} locale={locale} decorative className="aspect-[4/5] w-full" sizes="(max-width: 768px) 100vw, 30vw" />
                  <p className="mt-5 font-display text-[2rem] leading-none text-deep">{p.name}</p>
                  <p className="label mt-3 text-sea">{p.role}</p>
                </li>
              ))}
            </ul>
          </section>
          <BookingCta locale={locale} />
        </>
      );
    case "faq": {
      const faqs = await getFaqs();
      return (
        <>
          <JsonLd data={[faqJsonLd(locale, faqs), crumbs]} />
          <PageHero locale={locale} photo="grove" eyebrow={t.faq.eyebrow} title={t.faq.title} />
          <FaqList items={faqs} locale={locale} />
          <BookingCta locale={locale} />
        </>
      );
    }
    default:
      notFound();
  }
}
