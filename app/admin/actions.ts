"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { guestMail, sendMail, type Booking } from "@/lib/email";
import { photos } from "@/lib/photos";
import { CONTENT_TAG, SITE_ID } from "@/lib/supabase";
import { adminClient, currentAdmin } from "@/lib/supabase-server";

export type FormState = { error?: string; ok?: string } | undefined;

async function requireAdmin() {
  const a = await currentAdmin();
  if (!a.user || !a.allowed) redirect("/admin");
  return a.supabase;
}

/** Content changed: drop the cached reads and re-render every page. */
function publish() {
  revalidateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: "Wrong email or password." };
  redirect("/admin");
}

export async function signOut() {
  const supabase = await adminClient();
  await supabase.auth.signOut();
  redirect("/admin");
}

export async function decideBooking(_: FormState, form: FormData): Promise<FormState> {
  const { supabase, user, allowed } = await currentAdmin();
  if (!user || !allowed) return { error: "You are signed out. Reload the page and sign in again." };
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!id || (status !== "confirmed" && status !== "declined")) return { error: "Unknown request." };

  const { data, error } = await supabase
    .from("booking_requests")
    .update({ status })
    .eq("id", id)
    .eq("site_id", SITE_ID)
    .eq("status", "pending") // email the guest once, only on the first decision
    .select()
    .maybeSingle();
  if (error) {
    console.error("[admin] booking update failed", id, error);
    return { error: `Could not save: ${error.message}` };
  }
  if (!data) {
    console.warn("[admin] booking not pending or not found", id);
    revalidatePath("/admin");
    return { error: "This request was already answered." };
  }

  const mail = await sendMail(guestMail(data as Booking, status));
  console.log("[admin] booking", id, status, mail.ok ? "guest emailed" : `guest email NOT sent: ${mail.error}`);
  revalidatePath("/admin");
  const word = status === "confirmed" ? "Confirmed" : "Declined";
  return mail.ok
    ? { ok: `${word}. Email sent to ${data.email}.` }
    : { error: `${word}, but the email to ${data.email} was not sent. ${mail.error}` };
}

const L3 = ["hr", "en", "de"] as const;

export async function saveCatch(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  type Item = { name: Record<string, string>; how: Record<string, string>; price: string; soldOut: boolean; photo: string };
  let items: Item[];
  try {
    items = JSON.parse(String(form.get("items") ?? "[]"));
  } catch {
    return { error: "Could not read the list." };
  }
  items = items.filter((i) => i.name?.en?.trim() || i.name?.hr?.trim());
  if (!items.length) return { error: "Add at least one fish." };
  if (items.some((i) => !i.price?.trim())) return { error: "Every fish needs a price." };

  const settings: Record<string, string> = { catch_by: String(form.get("by") ?? "").slice(0, 60), catch_updated_at: new Date().toISOString() };
  for (const l of L3) {
    settings[`catch_headline_${l}`] = String(form.get(`headline_${l}`) ?? "").slice(0, 200);
    settings[`catch_note_${l}`] = String(form.get(`note_${l}`) ?? "").slice(0, 600);
  }

  const { error: e1 } = await supabase.from("site_settings").update(settings).eq("site_id", SITE_ID);
  if (e1) return { error: e1.message };
  const { error: e2 } = await supabase.from("catch_items").delete().eq("site_id", SITE_ID);
  if (e2) return { error: e2.message };
  const { error: e3 } = await supabase.from("catch_items").insert(
    items.map((i, sort) => ({
      site_id: SITE_ID,
      sort,
      price: i.price.trim().slice(0, 30),
      sold_out: Boolean(i.soldOut),
      photo: i.photo in photos ? i.photo : "catch",
      ...Object.fromEntries(L3.flatMap((l) => [[`name_${l}`, (i.name[l] || i.name.en || "").trim()], [`how_${l}`, (i.how?.[l] ?? "").trim()]])),
    })),
  );
  if (e3) return { error: e3.message };

  publish();
  return { ok: "Saved. The site shows the new catch now." };
}

export async function saveSeasonState(_: FormState, form: FormData): Promise<FormState> {
  const supabase = await requireAdmin();
  const seats = (k: string, min: number, max: number, fallback: number) => {
    const n = Math.round(Number(form.get(k)));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  const update: Record<string, string | boolean | number> = {
    closed_override: form.get("closed") === "on",
    terrace_seats: seats("terrace_seats", 0, 500, 40),
    indoor_seats: seats("indoor_seats", 0, 500, 24),
    seating_minutes: seats("seating_minutes", 30, 360, 120),
  };
  for (const l of L3) update[`closed_note_${l}`] = String(form.get(`closed_note_${l}`) ?? "").slice(0, 300);
  const { error } = await supabase.from("site_settings").update(update).eq("site_id", SITE_ID);
  if (error) return { error: error.message };
  publish();
  return { ok: update.closed_override ? "Saved. The site now shows “closed”." : "Saved. The site follows the normal hours." };
}
