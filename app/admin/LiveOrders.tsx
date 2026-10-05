"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { closeCall, getLive, setOrderStatus, type LiveCall, type LiveOrder } from "./actions";

const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ${m % 60} min ago`;
};
const eur = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(n);

/** Short two-note chime, made in the browser (no sound file). */
function chime() {
  try {
    const ctx = new AudioContext();
    [0, 0.18].forEach((t, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = i ? 1046 : 784;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.4);
    });
  } catch {}
}

const columns = [
  { status: "new", title: "New", tone: "border-coral/40 bg-[#fdf3ef]" },
  { status: "preparing", title: "Preparing", tone: "border-ochre/40 bg-[#fbf6ea]" },
  { status: "served", title: "Served (last 2 h)", tone: "border-deep/10 bg-white" },
] as const;

/**
 * Live board for orders sent from the tables, plus waiter and bill calls.
 * Refreshes every 6 seconds and chimes when something new arrives.
 */
export function LiveOrders() {
  const [data, setData] = useState<{ orders: LiveOrder[]; calls: LiveCall[] } | null>(null);
  const [sound, setSound] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  const soundRef = useRef(false);
  soundRef.current = sound;

  const load = useCallback(async () => {
    const d = await getLive().catch(() => null);
    if (!d) return;
    const ids = new Set([...d.orders.filter((o) => o.status === "new").map((o) => o.id), ...d.calls.map((c) => c.id)]);
    if (seen.current && [...ids].some((id) => !seen.current!.has(id)) && soundRef.current) chime();
    seen.current = ids;
    setData(d);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
  }, [load]);

  async function move(id: string, status: "preparing" | "served" | "cancelled") {
    setData((d) => (d ? { ...d, orders: d.orders.map((o) => (o.id === id ? { ...o, status, updated_at: new Date().toISOString() } : o)) } : d));
    await setOrderStatus(id, status);
    load();
  }
  async function done(id: string) {
    setData((d) => (d ? { ...d, calls: d.calls.filter((c) => c.id !== id) } : d));
    await closeCall(id);
    load();
  }

  const openCount = data ? data.orders.filter((o) => o.status !== "served").length + data.calls.length : 0;
  return (
    <section className="border border-deep/10 bg-white p-6 md:p-8" aria-labelledby="live">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="live" className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
          Live tables {openCount > 0 && <span className="ml-2 rounded-full bg-coral px-2 py-0.5 text-[0.65rem] text-white">{openCount}</span>}
        </h2>
        <button
          type="button"
          onClick={() => {
            setSound((s) => !s);
            if (!sound) chime();
          }}
          className={`rounded-full px-4 py-2 text-xs ${sound ? "bg-deep text-stone" : "border border-deep/20 text-deep"}`}
        >
          {sound ? "🔔 Sound on" : "🔕 Turn on sound"}
        </button>
      </div>

      {!data ? (
        <p className="mt-6 text-sm text-ink-soft">Loading…</p>
      ) : (
        <>
          {data.calls.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-3">
              {data.calls.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-full bg-deep py-2 pl-5 pr-2 text-stone">
                  <span className="text-sm">
                    {c.kind === "bill" ? "🧾" : "🙋"} <strong>Table {c.table_no}</strong> · {c.kind === "bill" ? "bill, please" : "waiter"} · {ago(c.created_at)}
                  </span>
                  <button type="button" onClick={() => done(c.id)} className="rounded-full bg-white px-3 py-1.5 text-xs text-deep">
                    Done
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {columns.map((col) => {
              const list = data.orders.filter((o) => o.status === col.status);
              return (
                <div key={col.status}>
                  <p className="mb-3 text-xs uppercase tracking-[0.15em] text-ink-soft">
                    {col.title} · {list.length}
                  </p>
                  <ul className="space-y-3">
                    {list.length === 0 && <li className="rounded-xl border border-dashed border-deep/15 px-4 py-6 text-center text-xs text-ink-soft">Nothing here</li>}
                    {list.map((o) => (
                      <li key={o.id} className={`rounded-xl border p-4 ${col.tone}`}>
                        <div className="flex items-baseline justify-between">
                          <p className="text-2xl font-light text-deep">Table {o.table_no}</p>
                          <p className="text-xs text-ink-soft">
                            {ago(o.created_at)} · {o.locale.toUpperCase()}
                          </p>
                        </div>
                        <ul className="mt-3 space-y-1.5 text-sm">
                          {o.items.map((it, i) => (
                            <li key={i}>
                              <strong className="tabular-nums">{it.qty}×</strong> {it.name_hr} <span className="text-ink-soft">· {it.name_en}</span>
                              {/kg/.test(it.price) && <span className="ml-1 rounded bg-sand px-1.5 text-[0.65rem] uppercase">weigh</span>}
                              {it.note && <span className="block pl-6 text-[0.8rem] italic text-coral">“{it.note}”</span>}
                            </li>
                          ))}
                        </ul>
                        {o.note && <p className="mt-2 text-[0.8rem] italic text-ink">Note: “{o.note}”</p>}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm tabular-nums text-ink-soft">{eur(Number(o.total))}</span>
                          <div className="flex gap-2">
                            {o.status === "new" && (
                              <>
                                <button type="button" onClick={() => move(o.id, "cancelled")} className="px-2 text-xs text-ink-soft underline">
                                  Cancel
                                </button>
                                <button type="button" onClick={() => move(o.id, "preparing")} className="rounded-full bg-deep px-4 py-2 text-xs text-stone">
                                  Start preparing
                                </button>
                              </>
                            )}
                            {o.status === "preparing" && (
                              <button type="button" onClick={() => move(o.id, "served")} className="rounded-full bg-[#1f6b43] px-4 py-2 text-xs text-white">
                                Mark served
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-xs text-ink-soft">Guests see each status change on their phone. Totals leave out fish sold by weight.</p>
        </>
      )}
    </section>
  );
}
