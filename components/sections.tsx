import type { MenuCategory, Tag } from "@/lib/content";
import { venue } from "@/lib/content";
import { getDict } from "@/lib/dict";
import { href, type Locale } from "@/lib/i18n";
import type { PhotoKey } from "@/lib/photos";
import Link from "next/link";
import { TableCta } from "./coast/TableCta";
import { Wave } from "./coast/Wave";
import { Pic } from "./Pic";

/** Inner-page opener: full-bleed photo, caps title, wave edge into the page. */
export function PageHero({ locale, photo, eyebrow, title, intro }: { locale: Locale; photo: PhotoKey; eyebrow: string; title: string; intro?: string }) {
  return (
    <header className="relative flex min-h-[82svh] items-end overflow-hidden text-white">
      <Pic name={photo} locale={locale} priority parallax={0.1} className="!absolute inset-0" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-deep/70 via-deep/20 to-deep/35" />
      <div className="container-k relative z-20 grid gap-8 pb-28 pt-40 md:grid-cols-12 md:pb-36">
        <div className="md:col-span-8">
          <p className="label text-white/80" data-reveal>
            {eyebrow}
          </p>
          <h1 className="caps mt-5 text-[clamp(3rem,8vw,7.5rem)]" data-split="load">
            {title}
          </h1>
        </div>
        {intro && (
          <p className="self-end text-[0.98rem] leading-relaxed text-white/85 md:col-span-4" data-reveal="0.5">
            {intro}
          </p>
        )}
      </div>
      <Wave className="text-stone" />
    </header>
  );
}

const directionNumbers = ["01", "02", "03", "04", "05"];

export function Directions({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const t = getDict(locale).visit;
  const blocks = compact ? t.blocks.filter((b) => b.id !== "bus") : t.blocks;
  return (
    <section className="py-24 md:py-36" aria-labelledby="visit-title">
      <div className="container-k grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="label text-sea" data-reveal>
            — {t.eyebrow}
          </p>
          <h2 id="visit-title" className="mt-6 font-display text-[clamp(2.6rem,4.6vw,4.6rem)] leading-[0.98] text-deep" data-split>
            {t.title}
          </h2>
          <address className="mt-10 border-t border-deep/15 pt-6 not-italic" data-reveal>
            <p className="label text-ink-soft">{t.address}</p>
            <p className="mt-3 font-display text-[1.7rem] leading-tight text-deep">
              {venue.street}
              <br />
              {venue.postalCode} {venue.locality}, {venue.island}
            </p>
            <p className="mt-4">
              <a href={`tel:${venue.phoneHref}`} className="text-ink underline decoration-ochre underline-offset-4">
                {venue.phone}
              </a>
            </p>
            <div className="mt-8">
              <a href={venue.mapsUrl} target="_blank" rel="noopener" className="inline-flex rounded-full bg-deep px-6 py-3.5 text-[0.88rem] tracking-wide text-stone transition-colors hover:bg-sea">
                {t.openMap} ↗
              </a>
            </div>
          </address>
        </div>
        <ol className="lg:col-span-7 lg:col-start-6">
          {blocks.map((b, i) => (
            <li key={b.id} className="grid gap-3 border-t border-deep/15 py-8 sm:grid-cols-[5rem_1fr] md:py-10" data-reveal>
              <span className="label pt-2 text-ochre-ink">{directionNumbers[i]}</span>
              <div>
                <h3 className="font-display text-[2rem] leading-none text-deep">{b.title}</h3>
                <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">{b.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      {compact && (
        <div className="container-k mt-6 lg:pl-[calc(5/12*100%+1rem)]">
          <ArrowLink href={href(locale, "visit")}>{getDict(locale).nav.visit}</ArrowLink>
        </div>
      )}
    </section>
  );
}

export function BookingCta({ locale }: { locale: Locale; photo?: PhotoKey }) {
  return <TableCta locale={locale} />;
}

function TagPill({ label }: { tag: Tag; label: string }) {
  return <span className="label rounded-full border border-deep/15 px-2.5 py-1 text-[0.58rem] text-ink-soft">{label}</span>;
}

export function MenuList({ locale, menu }: { locale: Locale; menu: MenuCategory[] }) {
  const t = getDict(locale).menuPage;
  return (
    <div className="container-k pb-24 md:pb-36">
      <nav aria-label={t.eyebrow} className="sticky top-0 z-30 -mx-4 border-b border-deep/10 bg-stone/[0.97] px-4 sm:-mx-8 sm:px-8 xl:-mx-14 xl:px-14">
        <ul className="flex gap-8 overflow-x-auto whitespace-nowrap py-5 [scrollbar-width:none]">
          {menu.map((c, i) => (
            <li key={c.id}>
              <a href={`#${c.id}`} className="group flex items-baseline gap-2 text-[0.92rem] text-ink-soft transition-colors hover:text-deep">
                <span className="label text-[0.55rem] text-ochre-ink">0{i + 1}</span>
                {c.name[locale]}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {menu.map((c, ci) => (
        <section key={c.id} id={c.id} aria-labelledby={`${c.id}-h`} className="grid scroll-mt-24 gap-10 border-b border-deep/10 py-16 last:border-0 md:py-24 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <p className="label text-ochre-ink">0{ci + 1}</p>
              <h2 id={`${c.id}-h`} className="mt-3 font-display text-[clamp(2.6rem,4.4vw,4.2rem)] leading-[0.95] text-deep" data-split>
                {c.name[locale]}
              </h2>
              <Pic name={c.photo} locale={locale} clip className="mt-8 aspect-[4/5] w-full max-w-sm" sizes="(max-width: 1024px) 90vw, 30vw" />
            </div>
          </div>
          <ul className="lg:col-span-7 lg:col-start-6">
            {c.items.map((item) => (
              <li key={item.name.en} className="border-t border-deep/10 py-7 first:border-0 first:pt-0 lg:first:pt-2" data-reveal>
                <div className="flex items-baseline gap-4">
                  <h3 className="font-display text-[1.85rem] leading-tight text-deep">{item.name[locale]}</h3>
                  <span aria-hidden className="mb-2 flex-1 border-b border-dotted border-deep/25" />
                  <p className="shrink-0 tabular-nums text-ink">{item.price} €</p>
                </div>
                <p className="mt-2 max-w-lg leading-relaxed text-ink-soft">{item.desc[locale]}</p>
                {(item.tags.length > 0 || item.signature) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.signature && <span className="label rounded-full bg-deep px-2.5 py-1 text-[0.58rem] text-stone">★ {t.signature}</span>}
                    {item.tags.map((tag) => (
                      <TagPill key={tag} tag={tag} label={t.tags[tag]} />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function FaqList({ items, locale }: { items: { q: Record<Locale, string>; a: Record<Locale, string> }[]; locale: Locale }) {
  return (
    <div className="container-k grid gap-10 py-20 md:py-32 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <Pic name="house" locale={locale} clip className="hidden aspect-[3/4] w-full max-w-sm lg:sticky lg:top-28 lg:block" sizes="30vw" />
      </div>
      <div className="lg:col-span-7 lg:col-start-6">
        {items.map((f, i) => (
          <details key={i} className="group border-t border-deep/15 last:border-b" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-7 [&::-webkit-details-marker]:hidden">
              <h2 className="font-display text-[clamp(1.6rem,2.4vw,2.2rem)] leading-tight text-deep">{f.q[locale]}</h2>
              <span aria-hidden className="mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-deep/20 text-deep transition-transform duration-500 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="max-w-2xl pb-8 pr-14 text-[1.02rem] leading-relaxed text-ink-soft">{f.a[locale]}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

export function ArrowLink({ href: to, children, light = false }: { href: string; children: React.ReactNode; light?: boolean }) {
  return (
    <Link href={to} className={`group inline-flex items-center gap-3 text-[0.95rem] tracking-wide ${light ? "text-stone" : "text-ink"}`}>
      <span className="relative">
        {children}
        <span className="absolute -bottom-1 left-0 h-px w-full origin-right scale-x-100 bg-current transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:origin-left group-hover:scale-x-0" />
      </span>
      <span
        aria-hidden
        className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-300 ${
          light ? "border-white/30 group-hover:bg-stone group-hover:text-deep" : "border-ink/20 group-hover:bg-deep group-hover:text-stone"
        }`}
      >
        →
      </span>
    </Link>
  );
}
