/**
 * Data access layer. Reads the site's rows from Supabase (filtered by
 * site_id) and maps them to the shapes in lib/content.ts. When Supabase is
 * not configured, or a query fails, the local content is served instead so
 * the site never breaks.
 */
import { cache } from "react";
import * as local from "./content";
import type { CatchItem, L, MenuCategory, Season, Tag } from "./content";
import { photos, type PhotoKey } from "./photos";
import type { Capacity, Usage } from "./capacity";
import { publicClient, SITE_ID, supabaseConfigured, writeClient } from "./supabase";

type Row = Record<string, unknown>;

const l = (r: Row, key: string): L => ({ hr: String(r[`${key}_hr`] ?? ""), en: String(r[`${key}_en`] ?? ""), de: String(r[`${key}_de`] ?? "") });
const photo = (v: unknown, fallback: PhotoKey): PhotoKey => (typeof v === "string" && v in photos ? (v as PhotoKey) : fallback);

async function fromDb<T>(label: string, query: () => Promise<T>, fallback: T): Promise<T> {
  if (!supabaseConfigured) return fallback;
  try {
    return await query();
  } catch (err) {
    console.error(`[data] ${label} failed, serving local content`, err);
    return fallback;
  }
}

async function rows(table: string, order = "sort") {
  const { data, error } = await publicClient().from(table).select("*").eq("site_id", SITE_ID).order(order);
  if (error) throw error;
  if (!data?.length) throw new Error(`${table} is empty for site ${SITE_ID}`);
  return data as Row[];
}

export const getMenu = cache(() =>
  fromDb<MenuCategory[]>(
    "menu",
    async () => {
      const [cats, items] = await Promise.all([rows("menu_categories"), rows("menu_items")]);
      return cats.map((c) => ({
        id: String(c.slug),
        name: l(c, "name"),
        photo: photo(c.photo, "catch"),
        items: items
          .filter((i) => i.category_id === c.id)
          .map((i) => ({
            name: l(i, "name"),
            desc: l(i, "description"),
            price: String(i.price),
            tags: (i.tags as Tag[]) ?? [],
            signature: Boolean(i.signature),
            ...(i.image ? { photo: photo(i.image, "catch") } : {}),
          })),
      }));
    },
    local.menu,
  ),
);

export const getSeasons = cache(() =>
  fromDb<Season[]>(
    "seasons",
    async () => {
      const [ss, hours] = await Promise.all([rows("seasons"), rows("opening_hours", "weekday")]);
      return ss.map((s) => {
        const week: Season["hours"] = {};
        for (let d = 0; d < 7; d++) {
          const h = hours.find((r) => r.season_id === s.id && r.weekday === d);
          week[d] = h?.opens && h?.closes ? [String(h.opens), String(h.closes)] : null;
        }
        return { id: String(s.id), name: l(s, "name"), from: String(s.from_md), to: String(s.to_md), hours: week };
      });
    },
    local.seasons,
  ),
);

const getSettings = cache(() => fromDb<Row | null>("settings", async () => (await rows("site_settings", "site_id"))[0], null));

export const getClosedOverride = cache(async () => {
  const s = await getSettings();
  return s ? { active: Boolean(s.closed_override), note: l(s, "closed_note") } : local.closedOverride;
});

export const getFaqs = cache(() =>
  fromDb(
    "faqs",
    async () => (await rows("faqs")).map((f) => ({ q: l(f, "question"), a: l(f, "answer") })),
    local.faqs,
  ),
);

export const getCatchOfDay = cache(async () => {
  const s = await getSettings();
  const items = await fromDb<CatchItem[]>(
    "catch",
    async () =>
      (await rows("catch_items")).map((c) => ({
        name: l(c, "name"),
        how: l(c, "how"),
        price: String(c.price),
        soldOut: Boolean(c.sold_out),
        photo: photo(c.photo, "catch"),
      })),
    local.catchOfDay.items,
  );
  if (!s) return { ...local.catchOfDay, items };
  return {
    updatedAt: String(s.catch_updated_at),
    by: String(s.catch_by),
    headline: l(s, "catch_headline"),
    note: l(s, "catch_note"),
    items,
  };
});

/** Seats per area and how long one sitting holds a table. */
export const getCapacity = cache(async (): Promise<Capacity> => {
  const s = await getSettings();
  return {
    terrace: Number(s?.terrace_seats ?? 40),
    indoor: Number(s?.indoor_seats ?? 24),
    minutes: Number(s?.seating_minutes ?? 120),
  };
});

/** Seats already requested per time and area on one day (totals only, always fresh). */
export async function getUsage(day: string): Promise<Usage[]> {
  if (!supabaseConfigured) return [];
  const { data, error } = await writeClient().rpc("slot_usage", { site: SITE_ID, day });
  if (error) {
    console.error("[data] slot_usage failed", error);
    return [];
  }
  return (data as { slot: string; seating: string; seats: number }[]).map((u) => ({ slot: u.slot, seating: u.seating, seats: Number(u.seats) }));
}
