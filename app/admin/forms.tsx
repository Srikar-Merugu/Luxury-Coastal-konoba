"use client";

import { useActionState, useState } from "react";
import type { CatchItem, L } from "@/lib/content";
import { photos, type PhotoKey } from "@/lib/photos";
import { decideBooking, saveCatch, saveSeasonState, signIn, type FormState } from "./actions";

const input = "mt-1 block w-full border border-deep/20 bg-white px-3 py-2 text-ink focus:border-deep focus:outline-none";
const lbl = "block text-xs uppercase tracking-[0.15em] text-ink-soft";
const LANGS = [
  ["hr", "HR"],
  ["en", "EN"],
  ["de", "DE"],
] as const;

function Status({ state }: { state: FormState }) {
  if (!state) return null;
  return (
    <p role="status" className={`text-sm ${state.error ? "text-coral" : "text-emerald-700"}`}>
      {state.error ?? state.ok}
    </p>
  );
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button disabled={pending} className="bg-deep px-6 py-3 text-sm text-stone hover:bg-sea disabled:opacity-50">
      {pending ? "Saving…" : children}
    </button>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <form action={action} className="mx-auto max-w-sm space-y-5 border border-deep/10 bg-white p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">Sign in</p>
      <label className="block">
        <span className={lbl}>Email</span>
        <input name="email" type="email" required autoComplete="username" className={input} />
      </label>
      <label className="block">
        <span className={lbl}>Password</span>
        <input name="password" type="password" required autoComplete="current-password" className={input} />
      </label>
      <Status state={state} />
      <Submit pending={pending}>Sign in</Submit>
    </form>
  );
}

type Catch = { headline: L; note: L; by: string; items: CatchItem[] };
const blank = (): CatchItem => ({ name: { hr: "", en: "", de: "" }, how: { hr: "", en: "", de: "" }, price: "", soldOut: false, photo: "catch" });

export function CatchEditor({ initial }: { initial: Catch }) {
  const [state, action, pending] = useActionState(saveCatch, undefined);
  const [items, setItems] = useState<CatchItem[]>(initial.items);
  const edit = (i: number, patch: Partial<CatchItem>) => setItems((list) => list.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i: number, d: number) =>
    setItems((list) => {
      const next = [...list];
      const [it] = next.splice(i, 1);
      next.splice(Math.max(0, Math.min(next.length, i + d)), 0, it);
      return next;
    });

  return (
    <form action={action} className="mt-6 space-y-8">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <ol className="space-y-4">
        {items.map((it, i) => (
          <li key={i} className={`border border-deep/10 p-4 ${it.soldOut ? "bg-stone-2" : "bg-stone"}`}>
            <div className="grid gap-3 md:grid-cols-3">
              {LANGS.map(([l, name]) => (
                <label key={l} className="block">
                  <span className={lbl}>Fish ({name})</span>
                  <input value={it.name[l]} onChange={(e) => edit(i, { name: { ...it.name, [l]: e.target.value } })} className={input} />
                </label>
              ))}
              {LANGS.map(([l, name]) => (
                <label key={l} className="block">
                  <span className={lbl}>How it&apos;s served ({name})</span>
                  <input value={it.how[l]} onChange={(e) => edit(i, { how: { ...it.how, [l]: e.target.value } })} className={input} />
                </label>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <label className="block w-32">
                <span className={lbl}>Price</span>
                <input value={it.price} placeholder="22 €" onChange={(e) => edit(i, { price: e.target.value })} className={input} />
              </label>
              <label className="block w-40">
                <span className={lbl}>Photo</span>
                <select value={it.photo} onChange={(e) => edit(i, { photo: e.target.value as PhotoKey })} className={input}>
                  {Object.keys(photos).map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input type="checkbox" checked={!!it.soldOut} onChange={(e) => edit(i, { soldOut: e.target.checked })} className="h-4 w-4 accent-[#c8573c]" />
                Sold out
              </label>
              <div className="ml-auto flex gap-2 pb-1 text-sm">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="px-2 disabled:opacity-30" aria-label="Move up">
                  ↑
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="px-2 disabled:opacity-30" aria-label="Move down">
                  ↓
                </button>
                <button type="button" onClick={() => setItems((l) => l.filter((_, j) => j !== i))} className="px-2 text-coral hover:underline">
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => setItems((l) => [...l, blank()])} className="text-sm text-deep underline">
        + Add a fish
      </button>

      <div className="grid gap-4 md:grid-cols-3">
        {LANGS.map(([l, name]) => (
          <div key={l} className="space-y-3">
            <label className="block">
              <span className={lbl}>Headline ({name})</span>
              <input name={`headline_${l}`} defaultValue={initial.headline[l]} className={input} />
            </label>
            <label className="block">
              <span className={lbl}>Note ({name})</span>
              <textarea name={`note_${l}`} defaultValue={initial.note[l]} rows={3} className={input} />
            </label>
          </div>
        ))}
      </div>
      <label className="block max-w-xs">
        <span className={lbl}>Updated by</span>
        <input name="by" defaultValue={initial.by} className={input} />
      </label>

      <div className="flex items-center gap-6">
        <Submit pending={pending}>Publish catch</Submit>
        <Status state={state} />
      </div>
    </form>
  );
}

export function SeasonForm({ initial }: { initial: { active: boolean; note: L } }) {
  const [state, action, pending] = useActionState(saveSeasonState, undefined);
  return (
    <form action={action} className="mt-6 space-y-6">
      <label className="flex items-start gap-3">
        <input type="checkbox" name="closed" defaultChecked={initial.active} className="mt-1 h-5 w-5 accent-[#c8573c]" />
        <span>
          <span className="block text-lg text-deep">Show “closed” now</span>
          <span className="text-sm text-ink-soft">For a storm, a private event or an early end of season. Untick to follow the normal hours.</span>
        </span>
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        {LANGS.map(([l, name]) => (
          <label key={l} className="block">
            <span className={lbl}>Short reason ({name}, optional)</span>
            <input name={`closed_note_${l}`} defaultValue={initial.note[l]} className={input} />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-6">
        <Submit pending={pending}>Save</Submit>
        <Status state={state} />
      </div>
    </form>
  );
}

export type BookingRow = {
  id: string;
  date: string;
  time: string;
  party_size: number;
  seating: string;
  large_group: boolean;
  name: string;
  phone: string;
  email: string;
  note: string;
  locale: string;
  status: "pending" | "confirmed" | "declined";
  created_at: string;
};

const fmtDay = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

/** Table requests with Confirm / Decline. The result stays visible above the list after the row moves out of "Waiting". */
export function BookingList({ bookings, emptyText }: { bookings: BookingRow[]; emptyText: string }) {
  const [state, action, pending] = useActionState(decideBooking, undefined);
  return (
    <>
      {state && (
        <div className="mt-4">
          <Status state={state} />
        </div>
      )}
      {!bookings.length && <p className="mt-6 text-ink-soft">{emptyText}</p>}
      <ul className="mt-4 divide-y divide-deep/10">
        {bookings.map((b) => (
          <li key={b.id} className="grid gap-3 py-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-lg text-deep">
                <strong className="font-semibold">{b.name}</strong> · {b.party_size} ppl · {fmtDay(b.date)} {b.time}
                {b.large_group && <span className="ml-2 rounded bg-ochre/20 px-2 py-0.5 text-xs uppercase tracking-wider text-deep">Large group</span>}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {b.seating} · <a href={`tel:${b.phone}`}>{b.phone}</a> · <a href={`mailto:${b.email}`}>{b.email}</a> · {b.locale.toUpperCase()} · received{" "}
                {new Date(b.created_at).toLocaleString("en-GB", { timeZone: "Europe/Zagreb", dateStyle: "short", timeStyle: "short" })}
              </p>
              {b.note && <p className="mt-2 text-sm italic text-ink">“{b.note}”</p>}
            </div>
            {b.status === "pending" ? (
              <div className="flex gap-2">
                <form action={action}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="status" value="confirmed" />
                  <button disabled={pending} className="bg-deep px-4 py-2 text-sm text-stone hover:bg-sea disabled:opacity-50">
                    Confirm
                  </button>
                </form>
                <form action={action}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="status" value="declined" />
                  <button
                    disabled={pending}
                    className="border border-deep/30 px-4 py-2 text-sm text-deep hover:border-coral hover:text-coral disabled:opacity-50"
                  >
                    Decline
                  </button>
                </form>
              </div>
            ) : (
              <span className={`text-sm font-semibold uppercase tracking-wider ${b.status === "confirmed" ? "text-emerald-700" : "text-coral"}`}>{b.status}</span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
