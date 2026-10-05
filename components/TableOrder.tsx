"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getDict } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";
import { priceOf, type OrderStatus } from "@/lib/order";

type Line = { key: string; name: string; price: string; qty: number; note: string };
type Placed = { id: string; token: string };
type Ctx = {
  table: string | null;
  lines: Line[];
  add: (key: string, name: string, price: string) => void;
  setQty: (key: string, qty: number) => void;
  qtyOf: (key: string) => number;
};

const OrderCtx = createContext<Ctx | null>(null);
const useOrder = () => useContext(OrderCtx);

const store = {
  get<T>(k: string, fallback: T): T {
    try {
      return JSON.parse(localStorage.getItem(k) ?? "") as T;
    } catch {
      return fallback;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

const eur = (n: number, locale: Locale) => new Intl.NumberFormat(locale === "hr" ? "hr-HR" : locale, { style: "currency", currency: "EUR" }).format(n);

/**
 * Ordering from the table. Active only when the menu was opened from a
 * table's QR code (?table=N); otherwise the menu stays a plain menu. The
 * basket is kept on the phone, so a reload doesn't lose it.
 */
export function TableOrder({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const [table, setTable] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const t = new URLSearchParams(location.search).get("table");
    if (!t || !/^\d{1,3}$/.test(t)) return;
    setTable(t);
    setLines(store.get<Line[]>(`konoba-basket-${t}`, []));
    document.documentElement.dataset.table = t;
    return () => {
      delete document.documentElement.dataset.table;
    };
  }, []);

  const save = useCallback(
    (next: Line[]) => {
      setLines(next);
      if (table) store.set(`konoba-basket-${table}`, next);
    },
    [table],
  );

  const value = useMemo<Ctx>(
    () => ({
      table,
      lines,
      add: (key, name, price) => {
        const hit = lines.find((l) => l.key === key);
        save(hit ? lines.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + 1) } : l)) : [...lines, { key, name, price, qty: 1, note: "" }]);
      },
      setQty: (key, qty) => save(qty <= 0 ? lines.filter((l) => l.key !== key) : lines.map((l) => (l.key === key ? { ...l, qty: Math.min(20, qty) } : l))),
      qtyOf: (key) => lines.find((l) => l.key === key)?.qty ?? 0,
    }),
    [table, lines, save],
  );

  return (
    <OrderCtx.Provider value={value}>
      {children}
      {table && <OrderBar locale={locale} table={table} lines={lines} save={save} />}
    </OrderCtx.Provider>
  );
}

/** "+ Add" next to a dish (only in table mode). */
export function AddDish({ locale, dishKey, name, price }: { locale: Locale; dishKey: string; name: string; price: string }) {
  const o = useOrder();
  if (!o?.table) return null;
  const t = getDict(locale).menuPage.order;
  const qty = o.qtyOf(dishKey);
  return qty ? (
    <div className="inline-flex items-center rounded-full border border-deep/25 bg-white">
      <button type="button" onClick={() => o.setQty(dishKey, qty - 1)} aria-label="−" className="h-9 w-9 text-lg text-deep">
        −
      </button>
      <span className="w-6 text-center tabular-nums font-semibold text-deep">{qty}</span>
      <button type="button" onClick={() => o.add(dishKey, name, price)} aria-label="+" className="h-9 w-9 text-lg text-deep">
        +
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => o.add(dishKey, name, price)}
      className="label rounded-full border border-deep px-4 py-2 text-[0.62rem] text-deep transition-colors hover:bg-deep hover:text-stone"
    >
      + {t.add}
    </button>
  );
}

function OrderBar({ locale, table, lines, save }: { locale: Locale; table: string; lines: Line[]; save: (l: Line[]) => void }) {
  const t = getDict(locale).menuPage.order;
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [statuses, setStatuses] = useState<Record<string, { status: OrderStatus; count: number }>>({});
  const [toast, setToast] = useState("");

  useEffect(() => setPlaced(store.get<Placed[]>(`konoba-orders-${table}`, [])), [table]);

  // Follow the status of this phone's orders every 10 s.
  useEffect(() => {
    if (!placed.length) return;
    const poll = async () => {
      const next: Record<string, { status: OrderStatus; count: number }> = {};
      await Promise.all(
        placed.map(async (p) => {
          const r = await fetch(`/api/order?id=${p.id}&token=${p.token}`).catch(() => null);
          if (r?.ok) {
            const d = await r.json();
            next[p.id] = { status: d.status, count: (d.items as { qty: number }[]).reduce((n, i) => n + i.qty, 0) };
          }
        }),
      );
      setStatuses(next);
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [placed]);

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((s, l) => s + (priceOf(l.price).amount ?? 0) * l.qty, 0);
  const hasKg = lines.some((l) => priceOf(l.price).perKg);

  async function send() {
    setState("sending");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, locale, note, items: lines.map((l) => ({ key: l.key, qty: l.qty, note: l.note })) }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { id, token } = await res.json();
      const nextPlaced = [{ id, token }, ...placed].slice(0, 10);
      setPlaced(nextPlaced);
      store.set(`konoba-orders-${table}`, nextPlaced);
      save([]);
      setNote("");
      setState("sent");
    } catch {
      setState("error");
    }
  }

  async function call(kind: "waiter" | "bill") {
    const r = await fetch("/api/call", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table, kind }) }).catch(() => null);
    setToast(r?.ok ? (kind === "bill" ? t.billSent : t.waiterSent) : t.error);
    setTimeout(() => setToast(""), 5000);
  }

  const showBar = count > 0 || placed.length > 0;
  return (
    <>
      {/* bottom bar: basket + quick calls */}
      <div className="fixed inset-x-3 bottom-3 z-50 sm:left-auto sm:right-6 sm:w-[420px]">
        {toast && (
          <p role="status" className="mb-2 rounded-2xl bg-deep px-4 py-3 text-center text-sm text-stone shadow-xl">
            {toast}
          </p>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => call("waiter")} className="flex-1 rounded-full bg-white/95 px-3 py-3 text-[0.78rem] font-medium text-deep shadow-lg ring-1 ring-deep/10 backdrop-blur">
            🙋 {t.waiter}
          </button>
          <button type="button" onClick={() => call("bill")} className="flex-1 rounded-full bg-white/95 px-3 py-3 text-[0.78rem] font-medium text-deep shadow-lg ring-1 ring-deep/10 backdrop-blur">
            🧾 {t.bill}
          </button>
        </div>
        {showBar && (
          <button
            type="button"
            onClick={() => {
              setState("idle");
              setOpen(true);
            }}
            className="mt-2 flex w-full items-center justify-between rounded-full bg-[#0b5f6e] py-3 pl-6 pr-3 text-white shadow-2xl shadow-deep/30"
          >
            <span className="text-sm">
              {count ? (
                <>
                  <strong>{t.basket(count)}</strong> · {eur(total, locale)}
                  {hasKg && <span className="opacity-75"> {t.plusFish}</span>}
                </>
              ) : (
                t.yourOrders
              )}
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-deep">{t.view}</span>
          </button>
        )}
      </div>

      {/* order sheet */}
      <div
        role="dialog"
        aria-label={t.title(table)}
        inert={!open}
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div className="absolute inset-0 bg-deep/40" onClick={() => setOpen(false)} />
        <div
          className={`absolute inset-x-0 bottom-0 flex max-h-[88svh] flex-col overflow-hidden rounded-t-3xl bg-stone transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[440px] sm:rounded-3xl ${
            open ? "translate-y-0" : "translate-y-full sm:translate-y-[110%]"
          }`}
        >
          <div className="flex items-center justify-between bg-[#0b5f6e] px-6 py-5 text-white">
            <p className="caps text-[1.25rem] leading-none">{t.title(table)}</p>
            <button type="button" onClick={() => setOpen(false)} aria-label={t.close} className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5" data-lenis-prevent>
            {state === "sent" && <p className="mb-5 rounded-2xl bg-[#e3f1e8] px-4 py-3 text-sm text-[#1f6b43]">✓ {t.sent}</p>}

            {lines.length ? (
              <ul className="divide-y divide-deep/10">
                {lines.map((l, i) => (
                  <li key={l.key} className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="font-display text-xl leading-tight text-deep">{l.name}</p>
                        <p className="text-sm text-ink-soft">{priceOf(l.price).perKg ? `${l.price.replace("/kg", " €/kg")} · ${t.perKg}` : eur(priceOf(l.price).amount ?? 0, locale)}</p>
                      </div>
                      <div className="inline-flex items-center rounded-full border border-deep/25 bg-white">
                        <button type="button" aria-label="−" onClick={() => save(l.qty <= 1 ? lines.filter((x) => x.key !== l.key) : lines.map((x) => (x.key === l.key ? { ...x, qty: x.qty - 1 } : x)))} className="h-9 w-9 text-lg text-deep">
                          −
                        </button>
                        <span className="w-6 text-center tabular-nums font-semibold">{l.qty}</span>
                        <button type="button" aria-label="+" onClick={() => save(lines.map((x) => (x.key === l.key ? { ...x, qty: Math.min(20, x.qty + 1) } : x)))} className="h-9 w-9 text-lg text-deep">
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      value={l.note}
                      maxLength={120}
                      onChange={(e) => save(lines.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
                      placeholder={t.dishNote}
                      className="mt-2 w-full rounded-full border border-deep/15 bg-white px-4 py-2 text-sm placeholder:text-ink-soft/60 focus:border-deep focus:outline-none"
                    />
                  </li>
                ))}
              </ul>
            ) : (
              state !== "sent" && <p className="py-6 text-center text-ink-soft">{t.empty}</p>
            )}

            {lines.length > 0 && (
              <>
                <textarea
                  value={note}
                  maxLength={300}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder={t.orderNote}
                  className="mt-4 w-full rounded-2xl border border-deep/15 bg-white px-4 py-3 text-sm placeholder:text-ink-soft/60 focus:border-deep focus:outline-none"
                />
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="label text-ink-soft">{t.total}</span>
                  <span className="font-display text-2xl text-deep">
                    {eur(total, locale)}
                    {hasKg && <span className="ml-1 text-sm text-ink-soft">{t.plusFish}</span>}
                  </span>
                </div>
              </>
            )}

            {placed.length > 0 && (
              <div className="mt-6 border-t border-deep/10 pt-5">
                <p className="label text-ink-soft">{t.yourOrders}</p>
                <ul className="mt-3 space-y-2">
                  {placed.map((p, i) => {
                    const s = statuses[p.id];
                    return (
                      <li key={p.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm">
                        <span>
                          #{placed.length - i} · {s ? t.basket(s.count) : "…"}
                        </span>
                        {s && (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              s.status === "served" ? "bg-[#e3f1e8] text-[#1f6b43]" : s.status === "preparing" ? "bg-[#fbefd9] text-ochre-ink" : s.status === "cancelled" ? "bg-[#f8e3dd] text-coral" : "bg-foam text-sea"
                            }`}
                          >
                            {t.status[s.status]}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <p className="mt-5 text-xs text-ink-soft">{t.payNote}</p>
          </div>

          <div className="border-t border-deep/10 bg-white px-6 py-4">
            {state === "error" && <p className="mb-2 text-sm text-coral">{t.error}</p>}
            {lines.length ? (
              <button type="button" onClick={send} disabled={state === "sending"} className="w-full rounded-full bg-deep py-4 font-display text-xl text-stone hover:bg-sea disabled:opacity-50">
                {state === "sending" ? t.sending : t.send}
              </button>
            ) : (
              <button type="button" onClick={() => setOpen(false)} className="w-full rounded-full border border-deep py-4 font-display text-xl text-deep">
                {t.addMore}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
