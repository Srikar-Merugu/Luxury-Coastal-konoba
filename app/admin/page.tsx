import Link from "next/link";
import { getCapacity, getCatchOfDay, getClosedOverride } from "@/lib/data";
import { SITE_ID, supabaseConfigured } from "@/lib/supabase";
import { currentAdmin } from "@/lib/supabase-server";
import { signOut } from "./actions";
import { BookingList, CatchEditor, LoginForm, SeasonForm, type BookingRow } from "./forms";

export const dynamic = "force-dynamic";


const card = "border border-deep/10 bg-white p-6 md:p-8";
const h2 = "text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  if (!supabaseConfigured) {
    return (
      <Shell>
        <div className={card}>
          <p className={h2}>Not connected</p>
          <p className="mt-4 max-w-prose text-ink-soft">
            Supabase is not configured for this deployment. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, run <code>supabase/schema.sql</code> and <code>supabase/seed.sql</code>, then
            reload. See the README.
          </p>
        </div>
      </Shell>
    );
  }

  const { supabase, user, allowed } = await currentAdmin();
  if (!user) {
    return (
      <Shell>
        <LoginForm />
      </Shell>
    );
  }
  if (!allowed) {
    return (
      <Shell email={user.email}>
        <div className={card}>
          <p className={h2}>No access</p>
          <p className="mt-4 text-ink-soft">
            {user.email} is signed in but is not an admin of this site. Add the user to the <code>admins</code> table for site{" "}
            <code>{SITE_ID}</code>.
          </p>
        </div>
      </Shell>
    );
  }

  const show = (await searchParams).show === "all" ? "all" : "open";
  let query = supabase.from("booking_requests").select("*").eq("site_id", SITE_ID).order("created_at", { ascending: false }).limit(200);
  if (show === "open") query = query.eq("status", "pending");
  const [{ data: bookings, error }, catchOfDay, override, capacity] = await Promise.all([query, getCatchOfDay(), getClosedOverride(), getCapacity()]);
  const list = (bookings ?? []) as BookingRow[];

  return (
    <Shell email={user.email}>
      <section className={card} aria-labelledby="bookings">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="bookings" className={h2}>
            Table requests
          </h2>
          <nav className="flex gap-4 text-sm">
            <Link href="/admin" className={show === "open" ? "font-semibold text-deep" : "text-ink-soft hover:text-deep"}>
              Waiting
            </Link>
            <Link href="/admin?show=all" className={show === "all" ? "font-semibold text-deep" : "text-ink-soft hover:text-deep"}>
              All
            </Link>
          </nav>
        </div>
        {error && <p className="mt-4 text-coral">{error.message}</p>}
        <BookingList bookings={list} emptyText={show === "open" ? "Nothing waiting. All requests are answered." : "No requests yet."} />
        <p className="mt-4 text-xs text-ink-soft">Confirm or decline emails the guest in their language.</p>
      </section>

      <section className={card} aria-labelledby="catch">
        <h2 id="catch" className={h2}>
          Catch of the day
        </h2>
        <CatchEditor initial={catchOfDay} />
      </section>

      <section className={card} aria-labelledby="season">
        <h2 id="season" className={h2}>
          Open, closed and seats
        </h2>
        <SeasonForm initial={override} capacity={capacity} />
        <p className="mt-6 text-xs text-ink-soft">
          Seasons, weekly hours, menu and FAQ are edited in the Supabase table editor (tables <code>seasons</code>,{" "}
          <code>opening_hours</code>, <code>menu_items</code>, <code>faqs</code>). Changes show on the site within a minute, no redeploy.
        </p>
      </section>
    </Shell>
  );
}


function Shell({ email, children }: { email?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ink-soft">Konoba Plavi Kamen</p>
          <h1 className="mt-1 text-3xl font-light text-deep">Owner admin</h1>
        </div>
        {email && (
          <form action={signOut} className="flex items-center gap-4 text-sm text-ink-soft">
            {email}
            <button className="underline hover:text-deep">Sign out</button>
          </form>
        )}
      </header>
      <div className="space-y-8">{children}</div>
      <p className="mt-12 text-xs text-ink-soft">
        Demo concept by{" "}
        <a href="https://kyrostudio.eu" className="underline">
          Kyro Studio
        </a>
        . Fictional venue.
      </p>
    </div>
  );
}
