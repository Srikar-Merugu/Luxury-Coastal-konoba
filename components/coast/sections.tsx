import Image from "next/image";
import Link from "next/link";
import type { MenuCategory } from "@/lib/content";
import { getCatchOfDay } from "@/lib/data";
import { getDict } from "@/lib/dict";
import { coast } from "@/lib/dict-coast";
import { href, type Locale } from "@/lib/i18n";
import { alts, photos, type PhotoKey } from "@/lib/photos";
import { DoodleFish, DoodleOlive } from "../doodles";
import { BeachVideo } from "./BeachVideo";
import { CatchBoard as CatchBoardView } from "./CatchBoard";
import { SandEdge, Wave } from "./Wave";

/** Caps title with its handwritten line laid across the bottom-right. */
export function Title({
  caps,
  script,
  as: Tag = "h2",
  className = "",
  scriptClass = "text-sage",
  split = true,
}: {
  caps: string;
  script?: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  scriptClass?: string;
  split?: boolean;
}) {
  return (
    <div className={className}>
      <Tag className="caps" data-split={split || undefined}>
        {caps}
      </Tag>
      {script && (
        <p className={`script -mt-[0.28em] pl-[0.8em] text-[0.62em] ${scriptClass}`} data-reveal="0.25">
          {script}
        </p>
      )}
    </div>
  );
}

/* ---------- We believe in ---------- */

export function Believe({ locale }: { locale: Locale }) {
  const t = coast[locale].believe;
  return (
    <section className="relative overflow-hidden bg-stone py-28 md:py-44">
      <DoodleOlive className="absolute -left-4 top-24 w-28 text-sage/70 md:left-[6%] md:w-36" data-parallax="0.2" />
      <DoodleFish className="absolute bottom-24 right-4 w-32 text-sage/70 md:right-[8%] md:w-44" data-parallax="0.25" />
      <div className="relative mx-auto max-w-6xl px-4 text-center">
        <p className="caps text-[clamp(1.4rem,2.6vw,2.2rem)] text-sea" data-reveal>
          {t.lead}
        </p>
        <ul className="mt-8 space-y-4 md:space-y-2">
          {t.lines.map((l, i) => (
            <li key={l.caps} className={`text-[clamp(3rem,8vw,7rem)] text-sea ${i % 2 ? "md:pl-[18%]" : "md:pr-[18%]"}`}>
              <Title caps={l.caps} script={l.script} as="h3" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Come for the fish: overhead surf film ---------- */

export function CoastBand({ locale }: { locale: Locale }) {
  const t = coast[locale].coast;
  return (
    <section className="relative h-[150svh] overflow-hidden bg-white">
      <div className="absolute inset-0" data-parallax="0.06">
        <Image src={photos.beach} alt={alts.beach[locale]} fill sizes="100vw" className="object-cover object-[center_45%]" />
        <BeachVideo />
      </div>
      <Wave position="top" gentle className="text-white" />
      <div className="absolute inset-x-0 top-[38%] z-20 px-4 text-center text-[clamp(2.4rem,6vw,5.8rem)] text-white drop-shadow-[0_2px_18px_rgba(0,40,70,.25)]">
        <div data-reveal>
          <h2 className="caps">{t.caps}</h2>
          <p className="script -mt-[0.28em] text-[0.82em]">{t.script}</p>
        </div>
      </div>
      <SandEdge />
    </section>
  );
}

/* ---------- Days in the cove: pinned horizontal cards ---------- */

export function DaysInCove({ locale }: { locale: Locale }) {
  const t = coast[locale].days;
  return (
    <section data-hscroll className="relative overflow-hidden bg-white" aria-labelledby="days-title">
      <div className="flex flex-col py-20 lg:h-screen lg:flex-row lg:items-center lg:py-0">
        <div className="container-k relative z-10 shrink-0 bg-white lg:flex lg:h-full lg:w-[34vw] lg:max-w-none lg:flex-col lg:justify-center lg:pr-12 lg:shadow-[30px_0_40px_-10px_#fff] xl:pl-14">
          <p className="label text-sea">{t.eyebrow}</p>
          <div id="days-title" className="mt-6 text-[clamp(2.8rem,5vw,4.8rem)] text-sea">
            <Title caps={t.title.caps} script={t.title.script} />
          </div>
          <p className="mt-8 max-w-sm text-[0.95rem] leading-relaxed text-ink-soft" data-reveal>
            {t.body}
          </p>
          <div className="mt-10 hidden items-center gap-4 text-xs tracking-[0.2em] text-sea lg:flex" aria-hidden>
            <span>01</span>
            <span className="relative h-px w-40 bg-sea/20">
              <span data-hscroll-progress className="absolute inset-0 origin-left bg-sea" />
            </span>
            <span>0{t.cards.length}</span>
          </div>
        </div>
        <div
          data-hscroll-track
          className="mt-12 flex min-w-0 flex-1 snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:px-8 lg:mt-0 lg:snap-none lg:gap-8 lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {t.cards.map((c, i) => (
            <article key={c.caps} className="flex w-[80vw] shrink-0 snap-start flex-col border border-sand bg-white/60 p-3 sm:w-[46vw] lg:w-[25vw] lg:p-4">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={photos[c.photo]} alt={alts[c.photo][locale]} fill sizes="(max-width: 1024px) 80vw, 25vw" className="object-cover transition-transform duration-[1200ms] hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col px-2 pb-2 pt-6">
                <p className="label text-[0.6rem] text-ochre">0{i + 1}</p>
                <div className="mt-2 text-[2.1rem] text-sea">
                  <Title caps={c.caps} script={c.script} as="h3" split={false} />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">{c.body}</p>
                <p className="mt-auto border-t border-sand pt-4 text-[0.68rem] uppercase tracking-[0.18em] text-ink-soft">{c.meta}</p>
              </div>
            </article>
          ))}
          <div className="w-px shrink-0 lg:w-[8vw]" aria-hidden />
        </div>
      </div>
    </section>
  );
}

/* ---------- From the boat to the table: dish gallery ---------- */

export function Gather({ locale, menu }: { locale: Locale; menu: MenuCategory[] }) {
  const t = coast[locale].gather;
  const dishes = menu.flatMap((c) => c.items).filter((i) => i.signature && i.photo);
  return (
    <section data-hscroll className="relative overflow-hidden bg-stone" aria-labelledby="gather-title">
      <div className="flex flex-col justify-center py-20 lg:h-screen lg:py-0">
        <div className="container-k mb-10 flex flex-col gap-4 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="label text-sea">{t.eyebrow}</p>
            <div id="gather-title" className="mt-5 text-[clamp(2.4rem,4.4vw,4.2rem)] text-sea">
              <Title caps={t.title.caps} script={t.title.script} />
            </div>
          </div>
          <Link href={href(locale, "menu")} className="label self-start border-b border-sea/40 pb-1 text-sea transition-colors hover:border-sea lg:self-auto">
            {getDict(locale).signature.cta} →
          </Link>
        </div>
        <div
          data-hscroll-track
          className="flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:px-8 lg:snap-none lg:gap-6 lg:overflow-visible lg:px-14 lg:pb-0"
        >
          {dishes.map((d, i) => (
            <figure key={d.name.en} className="group relative h-[62svh] w-[78vw] shrink-0 snap-start overflow-hidden sm:w-[46vw] lg:h-[60vh] lg:w-[36vw]">
              <Image src={photos[d.photo as PhotoKey]} alt={alts[d.photo as PhotoKey][locale]} fill sizes="(max-width: 1024px) 80vw, 36vw" className="object-cover transition-transform duration-[1400ms] group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-night/10 to-transparent" />
              <figcaption className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-white">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-white/75">{t.labels[i] ?? ""}</p>
                  <p className="caps mt-2 text-[clamp(1.6rem,2.4vw,2.4rem)]">{d.name[locale]}</p>
                </div>
                <p className="shrink-0 text-sm tabular-nums">{d.price} €</p>
              </figcaption>
            </figure>
          ))}
          <div className="w-px shrink-0 lg:w-[4vw]" aria-hidden />
        </div>
        <div className="container-k mt-8 hidden items-center gap-4 text-xs tracking-[0.2em] text-sea lg:flex" aria-hidden>
          <span className="relative h-px w-full bg-sea/15">
            <span data-hscroll-progress className="absolute inset-0 origin-left bg-sea" />
          </span>
        </div>
      </div>
    </section>
  );
}

/* ---------- Today's catch: printed editorial board ---------- */

export async function CatchBoard({ locale }: { locale: Locale }) {
  const data = await getCatchOfDay();
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zagreb" }).format(new Date(data.updatedAt));
  const day = new Intl.DateTimeFormat(locale === "hr" ? "hr-HR" : locale, { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Zagreb" }).format(
    new Date(data.updatedAt),
  );
  return (
    <CatchBoardView
      locale={locale}
      items={data.items}
      headline={data.headline[locale]}
      note={data.note[locale]}
      day={day}
      time={time}
      by={data.by}
    />
  );
}
