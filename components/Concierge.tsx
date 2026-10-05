"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getDict } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string };

/** Turns site paths (/en/book) and web links in an answer into links; tidies stray markdown. */
function Linkified({ text: raw }: { text: string }) {
  const text = raw.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, "$2").replace(/\*\*([^*]+)\*\*/g, "$1");
  const parts = text.split(/(https?:\/\/[^\s)]+|\/(?:hr|en|de)\/[a-z-]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="underline decoration-ochre underline-offset-2">
            {p.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}
          </a>
        ) : /^\/(hr|en|de)\//.test(p) ? (
          <Link key={i} href={p} className="underline decoration-ochre underline-offset-2">
            {p}
          </Link>
        ) : (
          p
        ),
      )}
    </>
  );
}

/**
 * "Ask us": AI host that answers guests from the site's live data (menu,
 * catch, hours, weather, directions, FAQ), streamed in as it types.
 */
export function Concierge({ locale }: { locale: Locale }) {
  const t = getDict(locale).chat;
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [msgs]);
  useEffect(() => {
    if (open) field.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, locale }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMsgs([...next, { role: "assistant", content: answer }]);
      }
      if (!answer) throw new Error("empty");
    } catch {
      setMsgs([...next, { role: "assistant", content: t.error }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="concierge"
        className={`fixed bottom-[5.25rem] right-4 z-40 flex items-center gap-2 rounded-full bg-[#0b5f6e] py-3 pl-4 pr-5 text-white shadow-2xl shadow-deep/30 transition-all duration-500 hover:bg-deep sm:bottom-6 sm:right-6 ${
          open ? "pointer-events-none translate-y-4 opacity-0" : ""
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M4 5h16v11H9l-5 4z" strokeLinejoin="round" />
          <path d="M8 10h8M8 13h5" strokeLinecap="round" />
        </svg>
        <span className="text-[0.72rem] uppercase tracking-[0.2em]">{t.open}</span>
      </button>

      <div
        id="concierge"
        role="dialog"
        aria-modal="false"
        aria-label={t.title}
        inert={!open}
        className={`fixed inset-x-0 bottom-0 z-[60] flex h-[85svh] flex-col overflow-hidden rounded-t-3xl bg-stone shadow-2xl shadow-deep/40 transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(640px,80svh)] sm:w-[380px] sm:rounded-3xl ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between bg-[#0b5f6e] px-6 pb-5 pt-6 text-white">
          <div>
            <p className="caps text-[1.35rem] leading-none">{t.title}</p>
            <p className="script mt-1 text-xl leading-none">{t.script}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t.close}
            className="-mr-2 -mt-1 flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div ref={list} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-5 py-5 text-[0.95rem] leading-relaxed" data-lenis-prevent>
          <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-ink shadow-sm">{t.hello}</p>
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <p key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-deep px-4 py-3 text-stone">
                {m.content}
              </p>
            ) : (
              <p key={i} className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-ink shadow-sm">
                {m.content ? (
                  <Linkified text={m.content} />
                ) : (
                  <span className="inline-flex gap-1 py-1" aria-label="…">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-soft" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-soft [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-soft [animation-delay:300ms]" />
                  </span>
                )}
              </p>
            ),
          )}
          {!msgs.length && (
            <div className="flex flex-wrap gap-2 pt-2">
              {t.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-full border border-deep/20 px-3 py-1.5 text-[0.82rem] text-deep hover:border-deep hover:bg-white"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="border-t border-deep/10 bg-white px-4 pb-4 pt-3"
        >
          <div className="flex items-center gap-2">
            <input
              ref={field}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={600}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              className="min-w-0 flex-1 rounded-full border border-deep/15 bg-stone px-4 py-3 text-[0.95rem] text-ink placeholder:text-ink-soft/70 focus:border-deep focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-full bg-deep px-4 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-stone disabled:opacity-40"
            >
              {t.send}
            </button>
          </div>
          <p className="mt-2 px-2 text-[0.7rem] text-ink-soft">{t.note}</p>
        </form>
      </div>
    </>
  );
}
