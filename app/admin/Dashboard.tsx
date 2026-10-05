import type { BookingRow } from "./forms";

const card = "border border-deep/10 bg-white p-6 md:p-8";
const h2 = "text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft";
const langName: Record<string, string> = { hr: "Croatian", en: "English", de: "German" };

/** YYYY-MM-DD in the venue's time zone, `offset` days from today. */
export function zagrebDay(offset = 0) {
  const d = new Date(Date.now() + offset * 864e5);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zagreb" }).format(d);
}

const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

function pct(n: number, total: number) {
  return total ? Math.round((n / total) * 100) : 0;
}

function Bar({ label, value, total }: { label: string; value: number; total: number }) {
  const p = pct(value, total);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-ink-soft">{p}%</span>
      </div>
      <div className="mt-1 h-1.5 bg-stone-2">
        <div className="h-full bg-sea" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

/**
 * Owner overview: tonight's tables, the coming week and how the last 30
 * days went. `bookings` covers 30 days back to 7 days ahead.
 */
export function Dashboard({ bookings }: { bookings: BookingRow[] }) {
  const today = zagrebDay();
  const live = bookings.filter((b) => b.status !== "declined");

  const tonight = live.filter((b) => b.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const tonightGuests = tonight.reduce((s, b) => s + b.party_size, 0);

  const week = Array.from({ length: 7 }, (_, i) => {
    const day = zagrebDay(i);
    const rows = live.filter((b) => b.date === day);
    return { day, tables: rows.length, guests: rows.reduce((s, b) => s + b.party_size, 0), pending: rows.filter((b) => b.status === "pending").length };
  });
  const maxGuests = Math.max(1, ...week.map((d) => d.guests));

  const since = Date.now() - 30 * 864e5;
  const recent = bookings.filter((b) => new Date(b.created_at).getTime() >= since);
  const answered = recent.filter((b) => b.status !== "pending");
  const confirmed = answered.filter((b) => b.status === "confirmed").length;
  const guests = recent.reduce((s, b) => s + b.party_size, 0);
  const byLang = ["de", "en", "hr"].map((l) => ({ l, n: recent.filter((b) => b.locale === l).length }));
  const bySeat = ["terrace", "indoor", "any"].map((s) => ({ s, n: recent.filter((b) => b.seating === s).length }));
  const times = Object.entries(recent.reduce<Record<string, number>>((m, b) => ((m[b.time] = (m[b.time] ?? 0) + 1), m), {}))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <section className={`${card} lg:col-span-2`} aria-labelledby="tonight">
        <h2 id="tonight" className={h2}>
          Today · {dayLabel(today)}
        </h2>
        <p className="mt-4 text-4xl font-light text-deep tabular-nums">
          {tonightGuests} <span className="text-base text-ink-soft">guests at {tonight.length} tables</span>
        </p>
        {tonight.length ? (
          <ul className="mt-6 divide-y divide-deep/10 text-sm">
            {tonight.map((b) => (
              <li key={b.id} className="flex items-baseline gap-3 py-2.5">
                <span className="w-12 tabular-nums font-semibold text-deep">{b.time}</span>
                <span className="flex-1">
                  {b.name} · {b.party_size} · {b.seating}
                  {b.note && <span className="ml-1 text-ochre-ink" title={b.note}>✎</span>}
                </span>
                {b.status === "pending" && <span className="text-xs uppercase tracking-wider text-coral">waiting</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-ink-soft">No tables booked for today yet.</p>
        )}
      </section>

      <section className={`${card} lg:col-span-3`} aria-labelledby="week">
        <h2 id="week" className={h2}>
          Next 7 days
        </h2>
        <ol className="mt-6 grid grid-cols-7 items-end gap-2">
          {week.map((d) => (
            <li key={d.day} className="flex flex-col items-center gap-2 text-center">
              <span className="text-xs tabular-nums text-ink-soft">{d.guests || ""}</span>
              <span className="flex h-28 w-full items-end bg-stone-2">
                <span className="w-full bg-sea/80" style={{ height: `${(d.guests / maxGuests) * 100}%` }} />
              </span>
              <span className="text-[0.7rem] leading-tight text-ink">{dayLabel(d.day).replace(" ", " ")}</span>
              {d.pending > 0 && <span className="rounded-full bg-coral px-1.5 text-[0.62rem] text-white">{d.pending} waiting</span>}
            </li>
          ))}
        </ol>
      </section>

      <section className={`${card} lg:col-span-5`} aria-labelledby="month">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="month" className={h2}>
            Last 30 days
          </h2>
          <a href="/admin/export" download className="text-sm text-deep underline">
            Download all bookings (CSV)
          </a>
        </div>
        <dl className="mt-6 grid gap-6 sm:grid-cols-4">
          {[
            ["Requests", recent.length],
            ["Guests", guests],
            ["Confirmed", answered.length ? `${pct(confirmed, answered.length)}%` : "–"],
            ["Large groups", recent.filter((b) => b.large_group).length],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dt className="text-xs uppercase tracking-[0.15em] text-ink-soft">{k}</dt>
              <dd className="mt-1 text-3xl font-light tabular-nums text-deep">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.15em] text-ink-soft">Guest language</p>
            {byLang.map(({ l, n }) => (
              <Bar key={l} label={langName[l]} value={n} total={recent.length} />
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.15em] text-ink-soft">Where they sit</p>
            {bySeat.map(({ s, n }) => (
              <Bar key={s} label={s === "any" ? "No preference" : s[0].toUpperCase() + s.slice(1)} value={n} total={recent.length} />
            ))}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-ink-soft">Busiest times</p>
            <ol className="mt-3 space-y-2 text-sm">
              {times.length ? (
                times.map(([t, n]) => (
                  <li key={t} className="flex justify-between">
                    <span className="tabular-nums font-semibold text-deep">{t}</span>
                    <span className="text-ink-soft">{n === 1 ? "1 request" : `${n} requests`}</span>
                  </li>
                ))
              ) : (
                <li className="text-ink-soft">No data yet.</li>
              )}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}
