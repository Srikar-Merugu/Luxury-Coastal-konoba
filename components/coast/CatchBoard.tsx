"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CatchItem } from "@/lib/content";
import { getDict } from "@/lib/dict";
import { coast } from "@/lib/dict-coast";
import type { Locale } from "@/lib/i18n";
import { whenIdle } from "@/lib/idle";
import { alts, photos } from "@/lib/photos";
import { SeasonStatus } from "../SeasonStatus";

type Props = {
  locale: Locale;
  items: CatchItem[];
  headline: string;
  note: string;
  day: string;
  time: string;
  by: string;
};

const INK = "#14137a";
const LEAF = "#4f7a43";

/**
 * Today's catch as a printed editorial page: white, indigo type, a short
 * list of today's fish where one is "lit" at a time, and a large print of
 * that fish with a tiny label and a handwritten note. The stage holds while
 * scrolling steps through the list; hovering a name lights it directly.
 */
export function CatchBoard({ locale, items, headline, note, day, time, by }: Props) {
  const t = coast[locale].board;
  const c = getDict(locale).catch;
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const n = items.length;

  useEffect(
    () =>
      whenIdle(() => {
        gsap.registerPlugin(ScrollTrigger);
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          refreshPriority: -1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setActive(Math.min(n - 1, Math.floor(self.progress * n))),
        });
        return () => st.kill();
      }),
    [n],
  );

  const it = items[active];

  return (
    <section
      ref={root}
      id="catch"
      className="relative bg-white text-[#14137a] lg:h-[var(--board-h)]"
      style={{ ["--board-h" as string]: `${100 + n * 45}svh` }}
      aria-labelledby="board-title"
    >
      {/* desktop: the stage holds while scrolling steps through the list; phones: normal flow, tap to switch */}
      <div className="flex flex-col lg:sticky lg:top-0 lg:min-h-[100svh] lg:overflow-hidden">
        {/* corner notes */}
        <p className="label absolute left-[4.5%] top-[11%] hidden text-[0.62rem] opacity-60 lg:block">{t.eyebrow}</p>
        <p className="absolute bottom-6 left-5 hidden max-w-xs text-[0.68rem] leading-relaxed opacity-60 md:left-[4.5%] md:block">
          {c.footnote} · {c.updated(time, by)}
        </p>

        <div className="container-k grid flex-1 items-center gap-10 py-20 lg:grid-cols-12 lg:gap-6 lg:py-0">
          {/* editorial block */}
          <div className="lg:col-span-4">
            <p className="label text-[0.62rem] opacity-80">{t.kicker}</p>
            <h2 id="board-title" className="caps mt-4 text-[clamp(2.2rem,3.4vw,3.2rem)]" style={{ color: INK }}>
              {t.title.caps}
            </h2>
            <p className="script -mt-1 text-[clamp(1.8rem,2.4vw,2.4rem)]" style={{ color: LEAF }}>
              {t.title.script}
            </p>
            <p className="mt-6 max-w-sm text-[0.84rem] leading-relaxed opacity-75">
              {headline} {note}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <p className="script text-2xl opacity-80">{day}</p>
              <SeasonStatus locale={locale} />
            </div>
          </div>

          {/* the list */}
          <ol className="lg:col-span-3 lg:col-start-6" aria-label={t.title.caps}>
            {items.map((item, i) => (
              <li key={item.name.en}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-current={active === i ? "true" : undefined}
                  className={`group flex w-full items-baseline gap-4 border-t border-[#14137a]/10 py-4 text-left transition-opacity duration-500 last:border-b ${
                    active === i ? "opacity-100" : "opacity-65 hover:opacity-80"
                  }`}
                >
                  <span className="w-6 text-[0.62rem] tracking-[0.2em]">0{i + 1}</span>
                  <span className={`flex-1 text-[0.82rem] uppercase tracking-[0.14em] ${item.soldOut ? "line-through" : ""}`}>{item.name[locale]}</span>
                  <span className="text-[0.72rem] tabular-nums tracking-wide">{item.soldOut ? c.soldOut : item.price}</span>
                </button>
              </li>
            ))}
          </ol>

          {/* the print */}
          <div className="relative lg:col-span-4 lg:col-start-9">
            <figure className="relative mx-auto w-full max-w-[420px] rotate-[1.5deg] bg-white p-3 pb-16 shadow-[0_30px_60px_rgba(20,19,122,.14)] ring-1 ring-[#14137a]/5">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f6f1e7]">
                {items.map((item, i) => (
                  <Image
                    key={item.name.en}
                    src={photos[item.photo]}
                    alt={alts[item.photo][locale]}
                    fill
                    sizes="(max-width: 1024px) 90vw, 30vw"
                    className={`object-cover transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] ${
                      active === i ? "scale-100 opacity-100" : "scale-105 opacity-0"
                    } ${item.soldOut ? "grayscale-[.6]" : ""}`}
                  />
                ))}
              </div>
              <figcaption className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                <span className="text-[0.56rem] uppercase tracking-[0.2em] opacity-70">
                  0{active + 1} / {it.soldOut ? c.soldOut : it.price} / {it.name[locale]}
                </span>
                <span className="script shrink-0 text-xl" style={{ color: LEAF }}>
                  {it.how[locale]}
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
