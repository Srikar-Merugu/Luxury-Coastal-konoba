"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Tag } from "@/lib/content";
import { getDict } from "@/lib/dict";
import { locales, type Locale } from "@/lib/i18n";
import { priceOf, type OrderStatus } from "@/lib/order";
import { photos, type PhotoKey } from "@/lib/photos";

export type AppDish = { key: string; name: string; desc: string; price: string; tags: Tag[]; signature: boolean; photo: PhotoKey | null };
export type AppCategory = { id: string; name: string; items: AppDish[] };
export type AppCatch = { headline: string; items: { name: string; how: string; price: string; soldOut: boolean }[] };

type Line = { key: string; name: string; price: string; qty: number; note: string };
type Placed = { id: string; token: string };
type View = "menu" | "basket" | "orders";

const store = {
  get<T>(k: string, fallback: T): T {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : fallback;
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

const steps: OrderStatus[] = ["new", "preparing", "served"];

/**
 * The table's ordering app, opened from the QR code: menu → order → status,
 * one screen at a time (the phone's back button moves between them).
 */
export function OrderApp({ locale, table, categories, fresh }: { locale: Locale; table: string; categories: AppCategory[]; fresh: AppCatch }) {
  const d = getDict(locale);
  const t = d.menuPage.order;
  const eur = (n: number) => new Intl.NumberFormat(locale === "hr" ? "hr-HR" : locale, { style: "currency", currency: "EUR" }).format(n);
  const priceLabel = (p: string) => (priceOf(p).perKg ? `${p.replace("/kg", "")} €/kg` : eur(priceOf(p).amount ?? 0));

  const [view, setView] = useState<View>("menu");
  const [lines, setLines] = useState<Line[]>([]);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [statuses, setStatuses] = useState<Record<string, { status: OrderStatus; items: { name: string; qty: number }[] }>>({});
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [diet, setDiet] = useState<Tag | "">("");
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const [service, setService] = useState(false);
  const [toast, setToast] = useState("");
  const tabs = useRef<HTMLDivElement>(null);

  // phone storage + back button
  useEffect(() => {
    setLines(store.get<Line[]>(`konoba-basket-${table}`, []));
    setPlaced(store.get<Placed[]>(`konoba-orders-${table}`, []));
    const fromHash = () => setView(location.hash === "#order" ? "basket" : location.hash === "#status" ? "orders" : "menu");
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [table]);
  const go = (v: View) => {
    const hash = v === "basket" ? "#order" : v === "orders" ? "#status" : "";
    if (location.hash !== hash) history.pushState(null, "", hash || location.pathname + location.search);
    setView(v);
    window.scrollTo({ top: 0 });
  };

  const save = useCallback(
    (next: Line[]) => {
      setLines(next);
      store.set(`konoba-basket-${table}`, next);
    },
    [table],
  );
  const qtyOf = (key: string) => lines.find((l) => l.key === key)?.qty ?? 0;
  const setQty = (dish: { key: string; name: string; price: string }, qty: number) => {
    const has = lines.some((l) => l.key === dish.key);
    if (qty <= 0) save(lines.filter((l) => l.key !== dish.key));
    else if (has) save(lines.map((l) => (l.key === dish.key ? { ...l, qty: Math.min(20, qty) } : l)));
    else save([...lines, { key: dish.key, name: dish.name, price: dish.price, qty: 1, note: "" }]);
  };

  // follow this phone's orders
  useEffect(() => {
    if (!placed.length) return;
    const poll = async () => {
      const next: typeof statuses = {};
      await Promise.all(
        placed.map(async (p) => {
          const r = await fetch(`/api/order?id=${p.id}&token=${p.token}`).catch(() => null);
          if (r?.ok) {
            const j = await r.json();
            const nameKey = `name_${locale}` as const;
            next[p.id] = { status: j.status, items: (j.items as Record<string, string | number>[]).map((i) => ({ name: String(i[nameKey] ?? i.name_en), qty: Number(i.qty) })) };
          }
        }),
      );
      setStatuses(next);
    };
    poll();
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, [placed, locale]);

  // highlight the category being read
  useEffect(() => {
    if (view !== "menu") return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id.replace("cat-", ""));
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    categories.forEach((c) => {
      const el = document.getElementById(`cat-${c.id}`);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [view, categories, diet]);
  useEffect(() => {
    tabs.current?.querySelector(`[data-tab="${active}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((s, l) => s + (priceOf(l.price).amount ?? 0) * l.qty, 0);
  const hasKg = lines.some((l) => priceOf(l.price).perKg);
  const visible = useMemo(
    () =>
      categories
        .map((c) => ({ ...c, items: c.items.filter((i) => !diet || i.tags.includes(diet) || (diet === "vegetarian" && i.tags.includes("vegan"))) }))
        .filter((c) => c.items.length),
    [categories, diet],
  );

  async function send() {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, locale, note, items: lines.map((l) => ({ key: l.key, qty: l.qty, note: l.note })) }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { id, token } = await res.json();
      const next = [{ id, token }, ...placed].slice(0, 10);
      setPlaced(next);
      store.set(`konoba-orders-${table}`, next);
      save([]);
      setNote("");
      history.replaceState(null, "", "#status");
      setView("orders");
      window.scrollTo({ top: 0 });
    } catch {
      setError(t.error);
    } finally {
      setSending(false);
    }
  }

  async function call(kind: "waiter" | "bill") {
    setService(false);
    const r = await fetch("/api/call", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table, kind }) }).catch(() => null);
    setToast(r?.ok ? (kind === "bill" ? t.billSent : t.waiterSent) : t.error);
    setTimeout(() => setToast(""), 4500);
  }

  const Stepper = ({ dish }: { dish: { key: string; name: string; price: string } }) => {
    const q = qtyOf(dish.key);
    return q ? (
      <div className="flex items-center rounded-full bg-deep text-stone">
        <button type="button" aria-label="−" onClick={() => setQty(dish, q - 1)} className="h-9 w-9 text-lg">
          −
        </button>
        <span className="w-5 text-center text-sm font-semibold tabular-nums">{q}</span>
        <button type="button" aria-label="+" onClick={() => setQty(dish, q + 1)} className="h-9 w-9 text-lg">
          +
        </button>
      </div>
    ) : (
      <button type="button" aria-label={`${t.add}: ${dish.name}`} onClick={() => setQty(dish, 1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-deep text-xl leading-none text-deep">
        +
      </button>
    );
  };

  return (
    <div className="mx-auto min-h-screen max-w-xl bg-stone pb-32">
      {/* header */}
      <header className="sticky top-0 z-30 bg-[#0b5f6e] text-white">
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="min-w-0">
            <p className="caps truncate text-[1.15rem] leading-none tracking-[0.08em]">Plavi Kamen</p>
            <p className="mt-1 text-xs opacity-80">{t.tableNo(table)}</p>
          </div>
          <div className="flex items-center gap-2">
            <nav aria-label="Language" className="flex rounded-full bg-white/10 p-0.5 text-[0.68rem] uppercase tracking-wider">
              {locales.map((l) => (
                <a key={l} href={`?lang=${l}`} aria-current={l === locale ? "true" : undefined} className="rounded-full px-2 py-1 aria-[current=true]:bg-white aria-[current=true]:text-deep">
                  {l}
                </a>
              ))}
            </nav>
            <button type="button" onClick={() => setService(true)} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-deep">
              🔔 {t.service}
            </button>
          </div>
        </div>
        {view === "menu" && (
          <div ref={tabs} className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
            {visible.map((c) => (
              <a
                key={c.id}
                data-tab={c.id}
                href={`#cat-${c.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(`cat-${c.id}`)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${active === c.id ? "bg-white text-deep" : "text-white/85"}`}
              >
                {c.name}
              </a>
            ))}
          </div>
        )}
      </header>

      {toast && (
        <p role="status" className="sticky top-[6.5rem] z-30 mx-4 mt-3 rounded-2xl bg-deep px-4 py-3 text-center text-sm text-stone shadow-lg">
          {toast}
        </p>
      )}

      {/* MENU */}
      {view === "menu" && (
        <main>
          {fresh.items.length > 0 && (
            <section className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <p className="label text-[0.6rem] text-ochre-ink">{t.fresh}</p>
              <p className="mt-1 text-sm text-ink-soft">{fresh.headline}</p>
              <ul className="mt-3 divide-y divide-deep/10">
                {fresh.items.map((f) => (
                  <li key={f.name} className={`flex items-baseline justify-between gap-3 py-2 text-sm ${f.soldOut ? "opacity-50" : ""}`}>
                    <span>
                      <span className={`font-medium text-deep ${f.soldOut ? "line-through" : ""}`}>{f.name}</span> <span className="text-ink-soft">· {f.how}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">{f.soldOut ? t.soldOut : f.price}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-soft">→ {t.askWaiter}</p>
            </section>
          )}

          <div className="flex gap-2 overflow-x-auto px-4 pt-4 [scrollbar-width:none]">
            {(["", "vegan", "vegetarian", "gluten-free"] as (Tag | "")[]).map((x) => (
              <button
                key={x || "all"}
                type="button"
                aria-pressed={diet === x}
                onClick={() => setDiet(x)}
                className="shrink-0 rounded-full border border-deep/20 px-3 py-1.5 text-xs text-ink-soft aria-pressed:border-deep aria-pressed:bg-deep aria-pressed:text-stone"
              >
                {x ? d.menuPage.tags[x] : d.menuPage.filterAll}
              </button>
            ))}
          </div>

          {visible.map((c) => (
            <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-28 px-4 pt-6">
              <h2 className="font-display text-[1.7rem] leading-none text-deep">{c.name}</h2>
              <ul className="mt-2 divide-y divide-deep/10">
                {c.items.map((it) => (
                  <li key={it.key} className="flex items-center gap-3 py-4">
                    {it.photo && (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                        <Image src={photos[it.photo]} alt="" fill sizes="64px" className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug text-deep">
                        {it.signature && <span className="mr-1 text-ochre-ink">★</span>}
                        {it.name}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[0.82rem] leading-snug text-ink-soft">{it.desc}</p>
                      <p className="mt-1 text-sm tabular-nums text-ink">
                        {priceLabel(it.price)}
                        {it.tags.length > 0 && <span className="ml-2 text-[0.7rem] text-sea">{it.tags.map((g) => d.menuPage.tags[g]).join(" · ")}</span>}
                      </p>
                    </div>
                    <Stepper dish={it} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="px-4 pt-6 text-xs text-ink-soft">{t.payNote}</p>
        </main>
      )}

      {/* ORDER */}
      {view === "basket" && (
        <main className="px-4 pt-4">
          <button type="button" onClick={() => history.back()} className="text-sm text-sea">
            ← {t.back}
          </button>
          <h1 className="mt-3 font-display text-3xl text-deep">{t.yourOrder}</h1>
          {lines.length === 0 ? (
            <p className="mt-6 text-ink-soft">{t.empty}</p>
          ) : (
            <>
              <ul className="mt-4 divide-y divide-deep/10 rounded-2xl bg-white px-4 shadow-sm">
                {lines.map((l, i) => (
                  <li key={l.key} className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-deep">{l.name}</p>
                        <p className="text-sm text-ink-soft">{priceOf(l.price).perKg ? `${priceLabel(l.price)} · ${t.perKg}` : priceLabel(l.price)}</p>
                      </div>
                      <Stepper dish={l} />
                    </div>
                    <input
                      value={l.note}
                      maxLength={120}
                      onChange={(e) => save(lines.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
                      placeholder={t.dishNote}
                      className="mt-2 w-full rounded-full border border-deep/15 bg-stone px-4 py-2 text-sm placeholder:text-ink-soft/60 focus:border-deep focus:outline-none"
                    />
                  </li>
                ))}
              </ul>
              <textarea
                value={note}
                maxLength={300}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder={t.orderNote}
                className="mt-4 w-full rounded-2xl border border-deep/15 bg-white px-4 py-3 text-sm placeholder:text-ink-soft/60 focus:border-deep focus:outline-none"
              />
              <div className="mt-4 flex items-baseline justify-between px-1">
                <span className="label text-ink-soft">{t.total}</span>
                <span className="font-display text-2xl text-deep">
                  {eur(total)} {hasKg && <span className="text-sm text-ink-soft">{t.plusFish}</span>}
                </span>
              </div>
              <p className="mt-3 px-1 text-xs text-ink-soft">{t.payNote}</p>
              {error && <p className="mt-3 text-sm text-coral">{error}</p>}
            </>
          )}
        </main>
      )}

      {/* STATUS */}
      {view === "orders" && (
        <main className="px-4 pt-4">
          <button type="button" onClick={() => go("menu")} className="text-sm text-sea">
            ← {t.back}
          </button>
          <h1 className="mt-3 font-display text-3xl text-deep">{t.yourOrders}</h1>
          {placed.length === 0 && <p className="mt-6 text-ink-soft">{t.empty}</p>}
          <ul className="mt-4 space-y-4">
            {placed.map((p, i) => {
              const s = statuses[p.id];
              const at = s ? steps.indexOf(s.status) : 0;
              return (
                <li key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-deep">{t.orderNo(placed.length - i)}</p>
                    <p className={`text-sm font-semibold ${s?.status === "cancelled" ? "text-coral" : "text-sea"}`}>{s ? t.status[s.status] : "…"}</p>
                  </div>
                  {s?.status !== "cancelled" && (
                    <ol className="mt-3 grid grid-cols-3 gap-1.5" aria-label={s ? t.status[s.status] : ""}>
                      {steps.map((st, k) => (
                        <li key={st}>
                          <span className={`block h-1.5 rounded-full ${k <= at ? "bg-[#0b5f6e]" : "bg-sand"}`} />
                          <span className={`mt-1 block text-[0.68rem] ${k <= at ? "text-deep" : "text-ink-soft"}`}>{t.status[st]}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {s && (
                    <p className="mt-3 text-sm text-ink-soft">
                      {s.items.map((it) => `${it.qty}× ${it.name}`).join(", ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          {placed.length > 0 && <p className="mt-5 rounded-2xl bg-[#e3f1e8] px-4 py-3 text-sm text-[#1f6b43]">✓ {t.sent}</p>}
        </main>
      )}

      {/* bottom action */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-xl bg-gradient-to-t from-stone via-stone to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
        {view === "menu" &&
          (count > 0 ? (
            <button type="button" onClick={() => go("basket")} className="flex w-full items-center justify-between rounded-full bg-[#0b5f6e] py-3.5 pl-6 pr-3 text-white shadow-xl">
              <span className="text-sm">
                <strong>{t.basket(count)}</strong> · {eur(total)}
                {hasKg && <span className="opacity-75"> {t.plusFish}</span>}
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-deep">{t.view}</span>
            </button>
          ) : placed.length > 0 ? (
            <button type="button" onClick={() => go("orders")} className="w-full rounded-full border border-deep bg-white py-3.5 text-sm font-medium text-deep shadow">
              {t.yourOrders} ({placed.length})
            </button>
          ) : null)}
        {view === "basket" && lines.length > 0 && (
          <button type="button" onClick={send} disabled={sending} className="w-full rounded-full bg-deep py-4 font-display text-xl text-stone disabled:opacity-50">
            {sending ? t.sending : `${t.send} · ${eur(total)}`}
          </button>
        )}
        {view === "orders" && (
          <button type="button" onClick={() => go("menu")} className="w-full rounded-full bg-[#0b5f6e] py-4 font-display text-xl text-white">
            {t.addMore}
          </button>
        )}
      </div>

      {/* service sheet */}
      <div className={`fixed inset-0 z-40 transition-opacity ${service ? "opacity-100" : "pointer-events-none opacity-0"}`} inert={!service}>
        <div className="absolute inset-0 bg-deep/40" onClick={() => setService(false)} />
        <div className={`absolute inset-x-0 bottom-0 mx-auto max-w-xl rounded-t-3xl bg-stone p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] transition-transform ${service ? "translate-y-0" : "translate-y-full"}`}>
          <p className="label text-ink-soft">{t.service}</p>
          <div className="mt-4 grid gap-3">
            <button type="button" onClick={() => call("waiter")} className="rounded-2xl bg-white px-5 py-4 text-left text-lg text-deep shadow-sm">
              🙋 {t.waiter}
            </button>
            <button type="button" onClick={() => call("bill")} className="rounded-2xl bg-white px-5 py-4 text-left text-lg text-deep shadow-sm">
              🧾 {t.bill}
            </button>
            <button type="button" onClick={() => setService(false)} className="py-2 text-sm text-ink-soft">
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
