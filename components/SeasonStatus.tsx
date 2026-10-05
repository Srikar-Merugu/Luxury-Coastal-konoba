"use client";

import { useEffect, useState } from "react";
import { getDict } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";
import { getStatus, type Status } from "@/lib/season";

/** `?preview=off-season` forces the closed-for-the-season state for demos and screenshots. */
export function useStatus(): Status | null {
  const [status, setStatus] = useState<Status | null>(null);
  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("preview");
    const update = () =>
      setStatus(preview === "off-season" ? { kind: "off-season", reopens: `${new Date().getFullYear() + 1}-04-01` } : getStatus());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);
  return status;
}

export function formatDate(iso: string, locale: Locale) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(locale === "hr" ? "hr-HR" : locale, { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(y, m - 1, d),
  );
}

export function statusLabel(status: Status, locale: Locale) {
  const t = getDict(locale).status;
  switch (status.kind) {
    case "open":
      return t.open(status.closes);
    case "later":
      return t.later(status.opens);
    case "closed-today":
      return t.closedToday;
    case "override":
      return t.override;
    case "off-season":
      return t.offSeason(formatDate(status.reopens, locale));
  }
}

export function SeasonStatus({ locale, tone = "dark", className = "" }: { locale: Locale; tone?: "light" | "dark"; className?: string }) {
  const status = useStatus();
  const open = status?.kind === "open";
  return (
    <p
      aria-live="polite"
      className={`inline-flex min-h-10 items-center gap-3 rounded-full border px-4 py-2 text-[0.8rem] tracking-wide backdrop-blur-md transition-opacity duration-700 ${
        tone === "light" ? "border-white/25 bg-white/10 text-stone" : "border-deep/15 bg-white/50 text-ink"
      } ${status ? "opacity-100" : "opacity-0"} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70 motion-reduce:hidden" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${open ? "bg-emerald-400" : "bg-coral"}`} />
      </span>
      {status ? statusLabel(status, locale) : "\u00a0"}
    </p>
  );
}
