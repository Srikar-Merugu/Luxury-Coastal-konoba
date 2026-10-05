import { NextResponse } from "next/server";
import { getMenu } from "@/lib/data";
import { isLocale } from "@/lib/i18n";
import { findDish, priceOf, type OrderLine } from "@/lib/order";
import { SITE_ID, supabaseConfigured, writeClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Per-phone limit (per server instance): 8 orders in 10 minutes.
const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now();
  const r = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  r.push(now);
  hits.set(ip, r);
  return r.length > 8;
};

/**
 * A table sends its order. Only dish keys and quantities are taken from the
 * guest; names and prices come from the live menu.
 */
export async function POST(req: Request) {
  if (!supabaseConfigured) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (limited(req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local")) return NextResponse.json({ error: "slow down" }, { status: 429 });

  let body: { table?: unknown; locale?: unknown; note?: unknown; items?: { key?: unknown; qty?: unknown; note?: unknown }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const table = Number(body.table);
  if (!Number.isInteger(table) || table < 1 || table > 200) return NextResponse.json({ error: "table" }, { status: 422 });
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 30) return NextResponse.json({ error: "items" }, { status: 422 });

  const menu = await getMenu();
  const lines: OrderLine[] = [];
  for (const raw of body.items) {
    const found = typeof raw.key === "string" ? findDish(menu, raw.key) : null;
    const qty = Number(raw.qty);
    if (!found || !Number.isInteger(qty) || qty < 1 || qty > 20) return NextResponse.json({ error: "item" }, { status: 422 });
    lines.push({
      key: raw.key as string,
      name_hr: found.item.name.hr,
      name_en: found.item.name.en,
      name_de: found.item.name.de,
      price: found.item.price,
      qty,
      note: typeof raw.note === "string" ? raw.note.trim().slice(0, 120) : "",
    });
  }
  const total = lines.reduce((s, l) => s + (priceOf(l.price).amount ?? 0) * l.qty, 0);

  const id = crypto.randomUUID();
  const token = crypto.randomUUID().replace(/-/g, "");
  const { error } = await writeClient()
    .from("table_orders")
    .insert({
      id,
      site_id: SITE_ID,
      table_no: table,
      items: lines,
      note: typeof body.note === "string" ? body.note.trim().slice(0, 300) : "",
      total,
      locale: typeof body.locale === "string" && isLocale(body.locale) ? body.locale : "en",
      status: "new",
      guest_token: token,
    });
  if (error) {
    console.error("[order] insert failed", error);
    return NextResponse.json({ error: "storage" }, { status: 500 });
  }
  return NextResponse.json({ id, token, total });
}

/** The guest's phone checks its order status with the token it got back. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = u.searchParams.get("id") ?? "";
  const token = u.searchParams.get("token") ?? "";
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^[0-9a-f]{32}$/.test(token)) return NextResponse.json({ error: "bad" }, { status: 400 });
  const { data, error } = await writeClient().rpc("order_status", { order_id: id, token });
  if (error || !data?.[0]) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(data[0], { headers: { "Cache-Control": "no-store" } });
}
