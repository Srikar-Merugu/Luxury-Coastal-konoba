import { getCoastNow, type Sky } from "@/lib/coast";
import { getDict } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

function SkyIcon({ sky, isDay }: { sky: Sky; isDay: boolean }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (sky === "clear")
    return isDay ? (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden {...common}>
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden {...common}>
      <path d="M7 17h10a4 4 0 0 0 .6-8A6 6 0 0 0 6.3 10 3.5 3.5 0 0 0 7 17z" />
      {(sky === "rain" || sky === "storm") && <path d="M9 20l-1 2M13 20l-1 2M17 20l-1 2" />}
    </svg>
  );
}

/**
 * "Right now in Lučica": air and sea temperature, sky and what the wind
 * means for the terrace. Server-rendered; hidden if the weather service fails.
 */
export async function CoastBar({ locale, tone = "light", className = "" }: { locale: Locale; tone?: "light" | "dark"; className?: string }) {
  const now = await getCoastNow();
  if (!now) return null;
  const t = getDict(locale).coastBar;
  const wet = now.sky === "rain" || now.sky === "storm";
  const w = t.wind[now.wind];
  const windText = typeof w === "function" ? w(now.gusts) : w;
  const advice = wet && (now.wind === "calm" || now.wind === "breeze") ? `${t.sky[now.sky]} · ${t.wet}` : windText;
  return (
    <p
      aria-label={t.label}
      className={`inline-flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-[1.4rem] border px-4 py-2 text-center text-[0.78rem] tracking-wide backdrop-blur-md ${
        tone === "light" ? "border-white/25 bg-white/10 text-white" : "border-deep/15 bg-white/60 text-ink"
      } ${className}`}
    >
      <span className="inline-flex items-center gap-2 tabular-nums">
        <SkyIcon sky={now.sky} isDay={now.isDay} />
        {now.air}°{now.sea !== null && <span className="opacity-80">· {t.sea} {now.sea}°</span>}
      </span>
      <span aria-hidden className="h-3 w-px bg-current opacity-30" />
      <span>{advice}</span>
    </p>
  );
}
