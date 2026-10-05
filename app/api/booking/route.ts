import { NextResponse } from "next/server";

const SEATING = ["terrace", "indoor", "any"] as const;

/**
 * Booking request endpoint. Validates the payload into the shape of the
 * starter's `booking_requests` row (plus konoba fields `seating` and
 * `large_group`).
 *
 * TODO(Kishlay, Tue pairing): insert into Supabase `booking_requests` with
 * status "pending" and trigger the owner + guest Resend emails. Until then
 * the request is only validated, so no guest data is stored anywhere.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const str = (k: string, max = 200) => (typeof body[k] === "string" ? (body[k] as string).trim().slice(0, max) : "");
  const row = {
    site_id: "konoba",
    date: str("date", 10),
    time: str("time", 5),
    party_size: Number(body.party_size),
    seating: SEATING.includes(body.seating as (typeof SEATING)[number]) ? body.seating : "any",
    large_group: Boolean(body.large_group),
    name: str("name"),
    phone: str("phone", 40),
    email: str("email"),
    note: str("note", 1000),
    locale: str("locale", 2),
    status: "pending" as const,
  };

  const errors: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) errors.push("date");
  if (!/^\d{2}:\d{2}$/.test(row.time)) errors.push("time");
  if (!Number.isInteger(row.party_size) || row.party_size < 1 || row.party_size > 30) errors.push("party_size");
  if (!row.name) errors.push("name");
  if (!row.phone) errors.push("phone");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push("email");
  if (errors.length) return NextResponse.json({ error: "validation", fields: errors }, { status: 422 });

  return NextResponse.json({ ok: true, status: row.status });
}
