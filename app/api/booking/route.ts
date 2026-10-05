import { NextResponse } from "next/server";
import { guestMail, ownerMail, sendMail, type Booking } from "@/lib/email";
import { isLocale } from "@/lib/i18n";
import { SITE_ID, supabaseConfigured, writeClient } from "@/lib/supabase";

const SEATING = ["terrace", "indoor", "any"] as const;

/**
 * Booking request: validate, store in `booking_requests` as pending (RLS lets
 * the public insert but never read), then email the owner inbox and the guest.
 * No availability engine: the owner confirms or declines in /admin.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: real people never see or fill this field.
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true, status: "pending" });

  const str = (k: string, max = 200) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const locale = str("locale", 2);
  const booking: Booking = {
    date: str("date", 10),
    time: str("time", 5),
    party_size: Number(body.party_size),
    seating: SEATING.includes(body.seating as (typeof SEATING)[number]) ? (body.seating as string) : "any",
    large_group: Boolean(body.large_group) || Number(body.party_size) >= 9,
    name: str("name"),
    phone: str("phone", 40),
    email: str("email"),
    note: str("note", 1000),
    locale: isLocale(locale) ? locale : "en",
  };

  const errors: string[] = [];
  const today = new Date(Date.now() - 864e5).toISOString().slice(0, 10); // allow for time zones
  if (!/^\d{4}-\d{2}-\d{2}$/.test(booking.date) || booking.date < today) errors.push("date");
  if (!/^\d{2}:\d{2}$/.test(booking.time)) errors.push("time");
  if (!Number.isInteger(booking.party_size) || booking.party_size < 1 || booking.party_size > 60) errors.push("party_size");
  if (!booking.name) errors.push("name");
  if (!booking.phone) errors.push("phone");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email)) errors.push("email");
  if (errors.length) return NextResponse.json({ error: "validation", fields: errors }, { status: 422 });

  if (supabaseConfigured) {
    const { error } = await writeClient()
      .from("booking_requests")
      .insert({ ...booking, site_id: SITE_ID, status: "pending" });
    if (error) {
      console.error("[booking] insert failed", error);
      return NextResponse.json({ error: "storage" }, { status: 500 });
    }
  } else {
    console.warn("[booking] Supabase not configured, request not stored");
  }

  const owner = ownerMail(booking);
  await Promise.allSettled([owner && sendMail(owner), sendMail(guestMail(booking, "received"))]);

  return NextResponse.json({ ok: true, status: "pending" });
}
