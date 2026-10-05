import { NextResponse } from "next/server";
import { SITE_ID } from "@/lib/supabase";
import { currentAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const cols = ["date", "time", "name", "party_size", "seating", "large_group", "phone", "email", "note", "locale", "status", "created_at"] as const;
const cell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** All booking requests as a CSV file (opens in Excel / Google Sheets). */
export async function GET() {
  const { supabase, user, allowed } = await currentAdmin();
  if (!user || !allowed) return NextResponse.redirect(new URL("/admin", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  const { data, error } = await supabase.from("booking_requests").select(cols.join(",")).eq("site_id", SITE_ID).order("date").order("time");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const csv = "﻿" + [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="konoba-bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
