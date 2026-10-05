import { NextResponse } from "next/server";
import { SITE_ID, supabaseConfigured, writeClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// One call of each kind per table every 2 minutes (per server instance).
const last = new Map<string, number>();

/** "Call the waiter" / "Bring the bill" from a table. */
export async function POST(req: Request) {
  if (!supabaseConfigured) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const table = Number(body.table);
  const kind = body.kind === "bill" ? "bill" : body.kind === "waiter" ? "waiter" : null;
  if (!kind || !Number.isInteger(table) || table < 1 || table > 200) return NextResponse.json({ error: "bad" }, { status: 422 });
  const k = `${table}:${kind}`;
  if (Date.now() - (last.get(k) ?? 0) < 2 * 60_000) return NextResponse.json({ ok: true, repeated: true });
  last.set(k, Date.now());
  const { error } = await writeClient().from("table_calls").insert({ site_id: SITE_ID, table_no: table, kind, status: "open" });
  if (error) {
    console.error("[call] insert failed", error);
    return NextResponse.json({ error: "storage" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
