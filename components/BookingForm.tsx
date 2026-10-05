"use client";

import { useEffect, useMemo, useState } from "react";
import { venue, type Season } from "@/lib/content";
import { getDict } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";
import { seasonFor, zagrebNow } from "@/lib/season";
import { track } from "@vercel/analytics";
import { freeAt, seatsFor, type Capacity, type Usage } from "@/lib/capacity";
import { venueWhatsApp } from "@/lib/whatsapp";
import { formatDate } from "./SeasonStatus";
import { useSiteData } from "./SiteData";
import { WhatsAppIcon } from "./icons";

type Seating = "terrace" | "indoor" | "any";

function slotsFor(seasons: Season[], dateIso: string): string[] {
  if (!dateIso) return [];
  const [y, m, d] = dateIso.split("-").map(Number);
  const season = seasonFor(seasons, dateIso.slice(5));
  if (!season) return [];
  const hours = season.hours[new Date(y, m - 1, d).getDay()];
  if (!hours) return [];
  const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
  const out: string[] = [];
  // Last seating 90 minutes before close.
  for (let t = toMin(hours[0]); t <= toMin(hours[1]) - 90; t += 30) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return out;
}

function firstBookableDate(seasons: Season[]): string {
  const now = zagrebNow();
  if (seasonFor(seasons, now.mmdd)) return `${now.year}-${now.mmdd}`;
  // next season start, this year or next
  const next = seasons.map((s) => s.from).sort().find((from) => from > now.mmdd);
  return next ? `${now.year}-${next}` : `${now.year + 1}-${seasons.map((s) => s.from).sort()[0] ?? "04-01"}`;
}

const field =
  "mt-2 block w-full rounded-none border-0 border-b border-deep/25 bg-transparent px-0 py-3 text-lg text-ink placeholder:text-ink-soft/50 focus:border-deep focus:outline-none focus:ring-0 disabled:opacity-40";
const label = "label text-ink-soft";

export function BookingForm({ locale }: { locale: Locale }) {
  const t = getDict(locale).book;
  const { seasons } = useSiteData();
  const minDate = useMemo(() => firstBookableDate(seasons), [seasons]);
  const [date, setDate] = useState(minDate);
  const [party, setParty] = useState(2);
  const [largeGroup, setLargeGroup] = useState(false);
  const [seating, setSeating] = useState<Seating>("terrace");
  const [time, setTime] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error" | "full">("idle");

  const slots = slotsFor(seasons, date);

  // Seats already requested on the chosen day, so each time shows what is left.
  const [avail, setAvail] = useState<{ capacity: Capacity; usage: Usage[] } | null>(null);
  useEffect(() => {
    setAvail(null);
    if (!date) return;
    const ctrl = new AbortController();
    fetch(`/api/availability?date=${date}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setAvail(d))
      .catch(() => {});
    return () => ctrl.abort();
  }, [date, state]);
  const left = (slot: string) => (avail ? seatsFor(freeAt(slot, avail.usage, avail.capacity), seating) : null);
  const chosenLeft = slots.includes(time) ? left(time) : null;
  const inSeason = !!seasonFor(seasons, date.slice(5));

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(form),
          party_size: party,
          large_group: largeGroup || party >= 9,
          seating,
          locale,
        }),
      });
      if (res.status === 409) {
        setState("full");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const event = { party_size: party, seating, large_group: largeGroup || party >= 9, locale };
      track("booking_submitted", event);
      (window as Window & { gtag?: (...a: unknown[]) => void }).gtag?.("event", "booking_submitted", event);
      setState("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="bg-deep p-10 text-stone md:p-16">
        <p className="label text-ochre">✓ {t.successTitle}</p>
        <h2 className="mt-6 font-display text-[clamp(2.4rem,4vw,3.6rem)] leading-none">{t.successTitle}</h2>
        <p className="mt-6 max-w-md text-lg text-stone/75">{t.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-12">
      {/* honeypot for bots; hidden from people and screen readers */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-px w-px opacity-0" />
      <div className="grid gap-8 sm:grid-cols-3">
        <label className="block">
          <span className={label}>{t.date}</span>
          <input type="date" name="date" required min={minDate} value={date} onChange={(e) => setDate(e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className={label}>{t.time}</span>
          <select name="time" required className={field} disabled={!slots.length} value={slots.includes(time) ? time : ""} onChange={(e) => setTime(e.target.value)}>
            <option value="" disabled>
              —
            </option>
            {slots.map((s) => {
              const n = left(s);
              const full = n !== null && n < party;
              return (
                <option key={s} value={s} disabled={full}>
                  {s}
                  {n === null ? "" : full ? ` · ${t.slotFull}` : n <= 12 ? ` · ${t.seatsLeft(n)}` : ""}
                </option>
              );
            })}
          </select>
        </label>
        <label className="block">
          <span className={label}>{t.party}</span>
          <select
            name="party_size"
            value={party}
            onChange={(e) => {
              const n = Number(e.target.value);
              setParty(n);
              if (n >= 9) setLargeGroup(true);
            }}
            className={field}
          >
            {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      {date && !slots.length && (
        <p role="alert" className="-mt-6 border-l-2 border-coral pl-4 text-sm text-coral">
          {inSeason ? t.closedDay : t.offSeason}
        </p>
      )}
      {chosenLeft !== null && chosenLeft >= party && chosenLeft <= 12 && (
        <p className="-mt-6 text-sm text-sea">
          {time} · {t.seatsLeft(chosenLeft)}
        </p>
      )}

      <fieldset>
        <legend className={label}>{t.seating}</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["terrace", t.terrace, "01"],
              ["indoor", t.indoor, "02"],
              ["any", t.noPref, "03"],
            ] as const
          ).map(([value, text, icon]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-3 border border-deep/20 px-5 py-5 transition-colors has-[:checked]:border-deep has-[:checked]:bg-deep has-[:checked]:text-stone has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ochre"
            >
              <input type="radio" name="seating_choice" value={value} checked={seating === value} onChange={() => setSeating(value)} className="sr-only" />
              <span aria-hidden className="label text-[0.6rem] opacity-80">
                {icon}
              </span>
              <span className="font-display text-xl leading-tight">{text}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-4 border-y border-deep/15 py-6">
        <input
          type="checkbox"
          checked={largeGroup}
          onChange={(e) => setLargeGroup(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-[#0c1f2c]"
        />
        <span>
          <span className="font-display text-2xl leading-tight text-deep">{t.largeGroup}</span>
          <span className="mt-1 block text-sm text-ink-soft">{t.largeGroupHint}</span>
        </span>
      </label>

      <div className="grid gap-8 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={label}>{t.name}</span>
          <input name="name" required autoComplete="name" className={field} />
        </label>
        <label className="block">
          <span className={label}>{t.phone}</span>
          <input name="phone" type="tel" required autoComplete="tel" inputMode="tel" className={field} />
        </label>
        <label className="block">
          <span className={label}>{t.email}</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        <label className="block sm:col-span-2">
          <span className={label}>{t.note}</span>
          <textarea name="note" rows={3} placeholder={t.notePlaceholder} className={field} />
        </label>
      </div>

      {state === "full" && (
        <p role="alert" className="border-l-2 border-coral pl-4 text-sm text-coral">
          {t.fullError}
        </p>
      )}
      {state === "error" && (
        <p role="alert" className="border-l-2 border-coral pl-4 text-sm text-coral">
          {t.error}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={state === "sending" || !slots.length}
          className="rounded-full bg-deep px-10 py-5 font-display text-2xl text-stone transition-colors hover:bg-sea disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state === "sending" ? t.sending : t.submit}
        </button>
        <p className="text-sm text-ink-soft">
          {t.orCall}{" "}
          <a href={`tel:${venue.phoneHref}`} className="text-ink underline decoration-ochre underline-offset-4">
            {venue.phone}
          </a>
        </p>
      </div>

      <a
        href={venueWhatsApp(
          t.whatsappText(
            formatDate(date, locale),
            slots.includes(time) ? time : "",
            party,
            t.whatsappSeating[seating],
          ),
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-4 border-t border-deep/15 pt-8 text-ink"
      >
        <span>
          <span className="label block text-ink-soft">{t.whatsapp}</span>
          <span className="mt-1 block font-display text-2xl text-deep">{t.whatsappCta}</span>
        </span>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1f7a4d] text-white transition-transform duration-500 group-hover:scale-110">
          <WhatsAppIcon />
        </span>
      </a>
    </form>
  );
}
