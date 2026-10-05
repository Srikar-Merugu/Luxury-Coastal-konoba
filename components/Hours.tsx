"use client";

import { useEffect, useState } from "react";
import type { Season } from "@/lib/content";
import { getDict } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";
import { seasonFor, zagrebNow } from "@/lib/season";
import { SeasonStatus } from "./SeasonStatus";

const order = [1, 2, 3, 4, 5, 6, 0];
const nowWord: Record<Locale, string> = { en: "Now", hr: "Sada", de: "Jetzt" };

/** Collapse a week into runs of equal hours: "Tue – Thu 12:00–22:00". */
function groupWeek(hours: Season["hours"]) {
  const runs: { from: number; to: number; value: [string, string] | null }[] = [];
  for (const d of order) {
    const v = hours[d];
    const last = runs.at(-1);
    if (last && JSON.stringify(last.value) === JSON.stringify(v)) last.to = d;
    else runs.push({ from: d, to: d, value: v });
  }
  return runs;
}

function fmtDate(mmdd: string, locale: Locale) {
  const [m, d] = mmdd.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "hr" ? "hr-HR" : locale, { day: "numeric", month: "long" }).format(new Date(2026, m - 1, d));
}

export function Hours({ locale, seasons }: { locale: Locale; seasons: Season[] }) {
  const t = getDict(locale).hours;
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => {
    const off = new URLSearchParams(location.search).get("preview") === "off-season";
    setCurrent(off ? null : (seasonFor(zagrebNow().mmdd)?.id ?? null));
  }, []);

  return (
    <section className="bg-deep-2 py-24 text-stone md:py-36" aria-labelledby="hours-title">
      <div className="container-k">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="label text-sea-soft" data-reveal>
              — {t.eyebrow}
            </p>
            <h2 id="hours-title" className="mt-6 font-display text-[clamp(2.6rem,5vw,5rem)] leading-[0.98]" data-split>
              {t.title}
            </h2>
            <SeasonStatus locale={locale} tone="light" className="mt-8" />
          </div>
          <div className="md:col-span-6 md:col-start-7">
            {seasons.map((s) => {
              const isNow = current === s.id;
              return (
                <article key={s.id} className="border-t border-white/15 py-8 first:border-t-0 md:first:pt-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-[2rem] leading-none">
                      {s.name[locale]}
                      {isNow && <span className="label ml-4 align-middle text-[0.6rem] text-ochre">● {nowWord[locale]}</span>}
                    </h3>
                    <p className="text-sm text-stone/60">
                      {fmtDate(s.from, locale)} – {fmtDate(s.to, locale)}
                    </p>
                  </div>
                  <dl className="mt-5 space-y-2 text-[0.95rem]">
                    {groupWeek(s.hours).map((r) => (
                      <div key={r.from} className="flex justify-between gap-4 text-stone/85">
                        <dt>
                          {t.weekdays[r.from]}
                          {r.from !== r.to && ` – ${t.weekdays[r.to]}`}
                        </dt>
                        <dd className="tabular-nums">{r.value ? `${r.value[0]} – ${r.value[1]}` : <span className="text-coral">{t.closed}</span>}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              );
            })}
            <p className="mt-4 border-t border-white/15 pt-8 font-display text-2xl italic text-sea-soft">{t.winter}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
