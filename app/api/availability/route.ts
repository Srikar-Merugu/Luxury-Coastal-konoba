import { NextResponse } from "next/server";
import { getCapacity, getUsage } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Seat capacity and seats already requested for one day; the form works out "seats left". */
export async function GET(req: Request) {
  const date = new URL(req.url).searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "date" }, { status: 400 });
  const [capacity, usage] = await Promise.all([getCapacity(), getUsage(date)]);
  return NextResponse.json({ capacity, usage }, { headers: { "Cache-Control": "no-store" } });
}
