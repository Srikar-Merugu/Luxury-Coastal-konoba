"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Tag } from "@/lib/content";
import { getDict } from "@/lib/dict";
import type { Locale } from "@/lib/i18n";

const diets: Tag[] = ["vegan", "vegetarian", "gluten-free"];

/**
 * Dietary filter chips. Sets data-diet on the menu; CSS in globals.css hides
 * dishes (and empty categories) that don't match, so the list itself stays
 * server-rendered.
 */
export function DietFilter({ locale, target }: { locale: Locale; target: string }) {
  const t = getDict(locale).menuPage;
  const [diet, setDiet] = useState<Tag | "">("");
  const pick = (d: Tag | "") => {
    setDiet(d);
    const el = document.getElementById(target);
    if (el) {
      if (d) el.dataset.diet = d;
      else delete el.dataset.diet;
    }
    // dishes moved: let the scroll animations re-measure
    requestAnimationFrame(() => ScrollTrigger.refresh());
  };
  return (
    <div role="group" aria-label={t.filterLabel} className="flex shrink-0 gap-2 py-3">
      {(["", ...diets] as (Tag | "")[]).map((d) => (
        <button
          key={d || "all"}
          type="button"
          aria-pressed={diet === d}
          onClick={() => pick(d)}
          className="label whitespace-nowrap rounded-full border border-deep/20 px-3 py-1.5 text-[0.6rem] text-ink-soft transition-colors hover:border-deep aria-pressed:border-deep aria-pressed:bg-deep aria-pressed:text-stone"
        >
          {d ? t.tags[d] : t.filterAll}
        </button>
      ))}
    </div>
  );
}

/** "Table 4 · welcome" when the menu was opened from a table's QR code. */
export function TableWelcome({ locale }: { locale: Locale }) {
  const table = useSearchParams().get("table");
  if (!table || !/^\d{1,3}$/.test(table)) return null;
  return (
    <p role="status" className="container-k">
      <span className="mt-8 inline-flex rounded-full bg-deep px-5 py-2.5 text-sm text-stone">{getDict(locale).menuPage.table(table)}</span>
    </p>
  );
}
