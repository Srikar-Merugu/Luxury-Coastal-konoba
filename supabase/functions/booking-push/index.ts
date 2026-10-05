// Sends a push alert to the owner's phones for each new table request,
// table order and waiter/bill call. Called by database triggers with
// { booking_id } / { order_id } / { call_id },
// or from /admin with { test: true, site } by a signed-in admin.
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const url = Deno.env.get("SUPABASE_URL")!;
const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const body = await req.json().catch(() => ({}));

  let site = "";
  let onlyUser: string | null = null;
  let payload: { title: string; body: string; url: string; tag: string };

  if (typeof body.booking_id === "string") {
    const { data: b } = await service.from("booking_requests").select("*").eq("id", body.booking_id).maybeSingle();
    // only fresh, pending requests, and only once each
    if (!b || b.status !== "pending" || b.push_sent_at || Date.now() - new Date(b.created_at).getTime() > 10 * 60_000) return json({ sent: 0 });
    await service.from("booking_requests").update({ push_sent_at: new Date().toISOString() }).eq("id", b.id);
    site = b.site_id;
    const day = new Date(`${b.date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
    payload = {
      title: `New table request · ${b.party_size} ${b.party_size === 1 ? "guest" : "guests"}`,
      body: `${b.name} · ${day} ${b.time} · ${b.seating}${b.large_group ? " · large group" : ""}${b.note ? ` · “${String(b.note).slice(0, 60)}”` : ""}`,
      url: "/admin",
      tag: b.id,
    };
  } else if (typeof body.order_id === "string") {
    const { data: o } = await service.from("table_orders").select("*").eq("id", body.order_id).maybeSingle();
    if (!o || o.status !== "new" || o.push_sent_at || Date.now() - new Date(o.created_at).getTime() > 10 * 60_000) return json({ sent: 0 });
    await service.from("table_orders").update({ push_sent_at: new Date().toISOString() }).eq("id", o.id);
    site = o.site_id;
    const items = (o.items as { name_en: string; qty: number }[]) ?? [];
    const count = items.reduce((n, i) => n + i.qty, 0);
    payload = {
      title: `Table ${o.table_no} · new order · ${count} ${count === 1 ? "dish" : "dishes"}`,
      body: items.map((i) => `${i.qty}× ${i.name_en}`).join(", ").slice(0, 160) + (o.note ? ` · “${String(o.note).slice(0, 60)}”` : ""),
      url: "/admin",
      tag: o.id,
    };
  } else if (typeof body.call_id === "string") {
    const { data: c } = await service.from("table_calls").select("*").eq("id", body.call_id).maybeSingle();
    if (!c || c.status !== "open" || c.push_sent_at || Date.now() - new Date(c.created_at).getTime() > 10 * 60_000) return json({ sent: 0 });
    await service.from("table_calls").update({ push_sent_at: new Date().toISOString() }).eq("id", c.id);
    site = c.site_id;
    payload = {
      title: c.kind === "bill" ? `Table ${c.table_no} · bill, please` : `Table ${c.table_no} · calling the waiter`,
      body: c.kind === "bill" ? "The guests at this table would like to pay." : "The guests at this table would like some help.",
      url: "/admin",
      tag: `call-${c.table_no}-${c.kind}`,
    };
  } else if (body.test === true && typeof body.site === "string") {
    const asUser = createClient(url, anon, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } }, auth: { persistSession: false } });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json({ error: "sign in" }, 401);
    const { data: isAdmin } = await asUser.rpc("is_site_admin", { site: body.site });
    if (isAdmin !== true) return json({ error: "not an admin" }, 403);
    site = body.site;
    onlyUser = user.id;
    payload = { title: "Alerts are on ✓", body: "New table requests will show up here.", url: "/admin", tag: "test" };
  } else {
    return json({ error: "bad request" }, 400);
  }

  const { data: cfg } = await service.from("private_config").select("key,value");
  const get = (k: string) => cfg?.find((r) => r.key === k)?.value ?? "";
  webpush.setVapidDetails(get("vapid_subject"), get("vapid_public"), get("vapid_private"));

  let q = service.from("push_subscriptions").select("*").eq("site_id", site);
  if (onlyUser) q = q.eq("user_id", onlyUser);
  const { data: subs } = await q;

  let sent = 0;
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600 });
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        // the phone unsubscribed or the browser dropped it: forget it
        if (code === 404 || code === 410) await service.from("push_subscriptions").delete().eq("id", s.id);
        else console.error("push failed", code, (err as Error).message);
      }
    }),
  );
  return json({ sent });
});
